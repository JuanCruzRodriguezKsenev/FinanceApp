/**
 * Server Actions para gestión de contactos (terceros)
 */

"use server";

import { db } from "@/db";
import {
  contacts,
  contactFolders,
  contactFolderMembers,
} from "@/db/schema/finance";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { createIdempotencyKey } from "@/lib/idempotency";
import {
  ok,
  err,
  authorizationError,
  validationError,
  databaseError,
  notFoundError,
  type Result,
  type AppError,
} from "@/lib/result";
import { eq, and, like, or } from "drizzle-orm";
import type { Contact } from "@/types";

/**
 * Crear un nuevo contacto
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
 * Obtener todos los contactos del usuario
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
