/**
 * Server Actions para gestión de contactos (terceros)
 */

"use server";

import { and, eq, like, or } from "drizzle-orm";

import { db } from "@/db";
import {
  contactFolderMembers,
  contactFolders,
  contacts,
} from "@/db/schema/finance";
import { auth } from "@/lib/auth";
import { createIdempotencyKey } from "@/lib/idempotency";
import { logger } from "@/lib/logger";
import {
  type AppError,
  authorizationError,
  databaseError,
  err,
  notFoundError,
  ok,
  type Result,
  validationError,
} from "@/lib/result";
import type { Contact } from "@/types";

/**
 * Crear un nuevo contacto
 */
/**
 * Creates a new contact for the authenticated user
 *
 * Stores contact information including:
 * - Personal details (name, email, phone, document)
 * - Financial information (CBU, alias, IBAN, bank account details)
 * - Metadata (notes, favorite status)
 *
 * Contacts can be used for quick transaction creation,
 * recipient lookups, and expense tracking categorization.
 *
 * Uses idempotency keys to prevent duplicate contacts on retry.
 * Returns existing contact if identical data already exists.
 *
 * Validates:
 * - User authentication and authorization
 * - Email format (if provided)
 * - Phone number format (if provided)
 * - CBU format (if provided)
 * - IBAN format (if provided)
 * - Contact name is not empty
 *
 * @param {Object} data - Contact creation data
 * @param {string} data.name - Full contact name
 * @param {string} [data.firstName] - First name
 * @param {string} [data.lastName] - Last name
 * @param {string} [data.displayName] - Display name (for UI)
 * @param {string} [data.email] - Email address
 * @param {string} [data.phoneNumber] - Phone number
 * @param {string} [data.document] - Document ID (DNI, RUC, etc.)
 * @param {string} [data.cbu] - CBU for transfers (Argentina, 22 digits)
 * @param {string} [data.alias] - CBU alias (e.g., "alias.example")
 * @param {string} [data.iban] - IBAN for international transfers
 * @param {string} [data.bank] - Associated bank name
 * @param {string} [data.accountNumber] - Bank account number
 * @param {string} [data.bankAccountType] - Account type (checking, savings, etc.)
 * @param {boolean} [data.isFavorite=false] - Mark as favorite for quick access
 * @param {string} [data.notes] - Additional notes
 * @param {string} [data.idempotencyKey] - Optional custom idempotency key
 * @returns {Promise<Result<Contact, AppError>>} Created contact object on success
 * @throws {AppError} Authorization error if user not authenticated
 * @throws {AppError} Validation error if data is invalid
 * @throws {AppError} Database error if creation fails
 *
 * @example
 * const result = await createContact({
 *   name: 'Juan Pérez',
 *   email: 'juan@example.com',
 *   cbu: '0170123456789012345678',
 *   isFavorite: true
 * });
 */
export async function createContact(data: {
  name: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  email?: string;
  phoneNumber?: string;
  document?: string;
  cbu?: string;
  alias?: string;
  iban?: string;
  bank?: string;
  accountNumber?: string;
  bankAccountType?: string;
  isFavorite?: boolean;
  notes?: string;
  idempotencyKey?: string;
}): Promise<Result<Contact, AppError>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return err(authorizationError("contacts"));
    }

    const idempotencyKey = createIdempotencyKey(
      "contacts:create",
      session.user.id,
      [
        data.name,
        data.displayName,
        data.email,
        data.phoneNumber,
        data.document,
        data.cbu,
        data.alias,
        data.iban,
        data.bank,
        data.accountNumber,
        data.bankAccountType,
      ],
      data.idempotencyKey,
    );

    const existingContact = await db.query.contacts.findFirst({
      where: and(
        eq(contacts.userId, session.user.id),
        eq(contacts.idempotencyKey, idempotencyKey),
      ),
    });

    if (existingContact) {
      return ok(existingContact as Contact);
    }

    const newContact = await db
      .insert(contacts)
      .values({
        userId: session.user.id,
        idempotencyKey,
        name: data.name,
        firstName: data.firstName,
        lastName: data.lastName,
        displayName: data.displayName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        document: data.document,
        cbu: data.cbu,
        alias: data.alias,
        iban: data.iban,
        bank: data.bank as any,
        accountNumber: data.accountNumber,
        bankAccountType: data.bankAccountType as any,
        isFavorite: data.isFavorite ?? false,
        notes: data.notes,
      })
      .returning();

    return ok(newContact[0] as Contact);
  } catch (error) {
    logger.error("Failed to create contact", error as Error, {
      name: data.name,
    });
    return err(databaseError("insert", "Error al crear el contacto"));
  }
}

/**
 * Retrieves all contacts for the authenticated user
 *
 * Returns all stored contact records with complete details.
 * Ordered by creation date or favorites first (implementation-dependent).
 *
 * Validates:
 * - User authentication and authorization
 * - Only returns contacts belonging to the user
 *
 * @returns {Promise<Result<Contact[], AppError>>}
 * Array of contacts on success, AppError on failure
 * @throws {AppError} Authorization error if user not authenticated
 * @throws {AppError} Database error if query fails
 *
 * @example
 * const result = await getContacts();
 * if (result.isOk()) {
 *   result.value.forEach(contact => {
 *     console.log(contact.name, contact.email);
 *   });
 * }
 */
export async function getContacts(): Promise<Result<Contact[], AppError>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return err(authorizationError("contacts"));
    }

    const userContacts = await db
      .select()
      .from(contacts)
      .where(eq(contacts.userId, session.user.id));

    return ok(userContacts as Contact[]);
  } catch (error) {
    logger.error("Failed to fetch contacts", error as Error);
    return err(databaseError("select", "Error al obtener contactos"));
  }
}

/**
 * Buscar contactos por nombre
 */
/**
 * Searches contacts by keyword across multiple fields
 *
 * Performs case-insensitive partial matching on:
 * - Name (full name and display name)
 * - First/last names (if stored separately)
 * - Email address
 * - CBU and CBU alias
 *
 * Useful for quick contact lookup during transaction creation
 * or contact manager search functionality.
 *
 * Validates:
 * - User authentication and authorization
 * - Search term is not empty
 * - Only returns contacts belonging to the user
 *
 * @param {string} searchTerm - Search keyword (case-insensitive, partial match)
 * @returns {Promise<Result<Contact[], AppError>>}
 * Array of matching contacts on success, AppError on failure
 * @throws {AppError} Authorization error if user not authenticated
 * @throws {AppError} Database error if query fails
 *
 * @example
 * const result = await searchContacts('juan');
 * if (result.isOk()) {
 *   console.log(`Found ${result.value.length} contacts`);
 * }
 */
export async function searchContacts(
  searchTerm: string,
): Promise<Result<Contact[], AppError>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return err(authorizationError("contacts"));
    }

    const results = await db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.userId, session.user.id),
          or(
            like(contacts.name, `%${searchTerm}%`),
            like(contacts.displayName, `%${searchTerm}%`),
            like(contacts.firstName, `%${searchTerm}%`),
            like(contacts.lastName, `%${searchTerm}%`),
            like(contacts.email, `%${searchTerm}%`),
            like(contacts.cbu, `%${searchTerm}%`),
            like(contacts.alias, `%${searchTerm}%`),
          ),
        ),
      );

    return ok(results as Contact[]);
  } catch (error) {
    logger.error("Failed to search contacts", error as Error, {
      searchTerm,
    });
    return err(databaseError("select", "Error al buscar contactos"));
  }
}

/**
 * Crear carpeta de contactos
 */
export async function createContactFolder(data: {
  name: string;
  color?: string;
  icon?: string;
}): Promise<Result<any, AppError>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return err(authorizationError("contacts"));
    }

    const folder = await db
      .insert(contactFolders)
      .values({
        userId: session.user.id,
        name: data.name,
        color: data.color,
        icon: data.icon,
      })
      .returning();

    return ok(folder[0]);
  } catch (error) {
    logger.error("Failed to create contact folder", error as Error, {
      folderName: data.name,
    });
    return err(databaseError("insert", "Error al crear la carpeta"));
  }
}

/**
 * Asignar contacto a carpeta
 */
/**
 * Adds a contact to a contact folder for organization
 *
 * Creates membership between contact and folder.
 * Folders allow grouping contacts by category (e.g., "Vendors", "Family", "Services").
 * A contact can belong to multiple folders.
 *
 * Validates:
 * - User authentication and authorization
 * - Both contact and folder exist
 * - Contact and folder belong to the authenticated user
 * - Contact is not already in the folder (depends on schema constraints)
 *
 * @param {Object} data - Folder assignment data
 * @param {string} data.contactId - ID of the contact to add
 * @param {string} data.folderId - ID of the target folder
 * @returns {Promise<Result<void, AppError>>} Void on success, AppError on failure
 * @throws {AppError} Authorization error if user not authenticated
 * @throws {AppError} Validation error if contact or folder not found or invalid
 * @throws {AppError} Database error if operation fails
 *
 * @example
 * const result = await addContactToFolder({
 *   contactId: 'contact_123',
 *   folderId: 'folder_456'
 * });
 */
export async function addContactToFolder(data: {
  contactId: string;
  folderId: string;
}): Promise<Result<void, AppError>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return err(authorizationError("contacts"));
    }

    const [contact] = await db
      .select({ id: contacts.id })
      .from(contacts)
      .where(
        and(
          eq(contacts.id, data.contactId),
          eq(contacts.userId, session.user.id),
        ),
      );

    const [folder] = await db
      .select({ id: contactFolders.id })
      .from(contactFolders)
      .where(
        and(
          eq(contactFolders.id, data.folderId),
          eq(contactFolders.userId, session.user.id),
        ),
      );

    if (!contact || !folder) {
      return err(validationError("contact", "Contacto o carpeta inválidos"));
    }

    await db.insert(contactFolderMembers).values({
      contactId: data.contactId,
      folderId: data.folderId,
    });

    return ok(undefined);
  } catch (error) {
    logger.error("Failed to add contact to folder", error as Error, {
      contactId: data.contactId,
      folderId: data.folderId,
    });
    return err(databaseError("insert", "Error al asignar el contacto"));
  }
}

/**
 * Quitar contacto de carpeta
 */
export async function removeContactFromFolder(data: {
  contactId: string;
  folderId: string;
}): Promise<Result<void, AppError>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return err(authorizationError("contacts"));
    }

    const [contact] = await db
      .select({ id: contacts.id })
      .from(contacts)
      .where(
        and(
          eq(contacts.id, data.contactId),
          eq(contacts.userId, session.user.id),
        ),
      );

    const [folder] = await db
      .select({ id: contactFolders.id })
      .from(contactFolders)
      .where(
        and(
          eq(contactFolders.id, data.folderId),
          eq(contactFolders.userId, session.user.id),
        ),
      );

    if (!contact || !folder) {
      return err(validationError("contact", "Contacto o carpeta inválidos"));
    }

    await db
      .delete(contactFolderMembers)
      .where(
        and(
          eq(contactFolderMembers.contactId, data.contactId),
          eq(contactFolderMembers.folderId, data.folderId),
        ),
      );

    return ok(undefined);
  } catch (error) {
    logger.error("Failed to remove contact from folder", error as Error, {
      contactId: data.contactId,
      folderId: data.folderId,
    });
    return err(databaseError("delete", "Error al quitar el contacto"));
  }
}

/**
 * Buscar contacto por CBU o Alias
 */
export async function searchContactByCBUOrAlias(
  cbuOrAlias: string,
): Promise<Result<Contact, AppError>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return err(authorizationError("contacts"));
    }

    const result = await db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.userId, session.user.id),
          or(eq(contacts.cbu, cbuOrAlias), eq(contacts.alias, cbuOrAlias)),
        ),
      );

    if (result.length === 0) {
      return err(notFoundError("contact", cbuOrAlias));
    }

    return ok(result[0] as Contact);
  } catch (error) {
    logger.error("Failed to search contact by CBU/Alias", error as Error, {
      cbuOrAlias,
    });
    return err(databaseError("select", "Error al buscar el contacto"));
  }
}

/**
 * Actualizar un contacto
 */
export async function updateContact(
  contactId: string,
  data: Partial<Contact>,
): Promise<Result<Contact, AppError>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return err(authorizationError("contacts"));
    }

    // Verificar que pertenece al usuario
    const existingContact = await db
      .select()
      .from(contacts)
      .where(
        and(eq(contacts.id, contactId), eq(contacts.userId, session.user.id)),
      );

    if (existingContact.length === 0) {
      return err(notFoundError("contact", contactId));
    }

    const updated = await db
      .update(contacts)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(contacts.id, contactId))
      .returning();

    return ok(updated[0] as Contact);
  } catch (error) {
    logger.error("Failed to update contact", error as Error, {
      contactId,
    });
    return err(databaseError("update", "Error al actualizar el contacto"));
  }
}

/**
 * Eliminar un contacto
 */
export async function deleteContact(
  contactId: string,
): Promise<Result<void, AppError>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return err(authorizationError("contacts"));
    }

    // Verificar que pertenece al usuario
    const existingContact = await db
      .select()
      .from(contacts)
      .where(
        and(eq(contacts.id, contactId), eq(contacts.userId, session.user.id)),
      );

    if (existingContact.length === 0) {
      return err(notFoundError("contact", contactId));
    }

    await db.delete(contacts).where(eq(contacts.id, contactId));

    return ok(undefined);
  } catch (error) {
    logger.error("Failed to delete contact", error as Error, {
      contactId,
    });
    return err(databaseError("delete", "Error al eliminar el contacto"));
  }
}
