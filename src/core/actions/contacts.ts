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
}): Promise<{ success: boolean; data?: Contact; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autenticado" };
    }

    const newContact = await db
      .insert(contacts)
      .values({
        userId: session.user.id,
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

    return { success: true, data: newContact[0] as any };
  } catch (error) {
    logger.error("Failed to create contact", error as Error, {
      userId: session.user.id,
      name: data.name,
    });
    return {
      success: false,
      error: "Error al crear el contacto",
    };
  }
}

/**
 * Obtener todos los contactos del usuario
 */
export async function getContacts(): Promise<{
  success: boolean;
  data?: Contact[];
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autenticado" };
    }

    const userContacts = await db
      .select()
      .from(contacts)
      .where(eq(contacts.userId, session.user.id));

    return { success: true, data: userContacts as Contact[] };
  } catch (error) {
    logger.error("Failed to fetch contacts", error as Error, {
      userId: session.user.id,
    });
    return { success: false, error: "Error al obtener contactos" };
  }
}

/**
 * Buscar contactos por nombre
 */
export async function searchContacts(searchTerm: string): Promise<{
  success: boolean;
  data?: Contact[];
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autenticado" };
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

    return { success: true, data: results as Contact[] };
  } catch (error) {
    logger.error("Failed to search contacts", error as Error, {
      userId: session.user.id,
      searchTerm,
    });
    return { success: false, error: "Error al buscar contactos" };
  }
}

/**
 * Crear carpeta de contactos
 */
export async function createContactFolder(data: {
  name: string;
  color?: string;
  icon?: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autenticado" };
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

    return { success: true, data: folder[0] };
  } catch (error) {
    logger.error("Failed to create contact folder", error as Error, {
      userId: session.user.id,
      folderName: data.name,
    });
    return { success: false, error: "Error al crear la carpeta" };
  }
}

/**
 * Asignar contacto a carpeta
 */
export async function addContactToFolder(data: {
  contactId: string;
  folderId: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autenticado" };
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
      return { success: false, error: "Contacto o carpeta inválidos" };
    }

    await db.insert(contactFolderMembers).values({
      contactId: data.contactId,
      folderId: data.folderId,
    });

    return { success: true };
  } catch (error) {
    logger.error("Failed to add contact to folder", error as Error, {
      contactId: data.contactId,
      folderId: data.folderId,
    });
    return { success: false, error: "Error al asignar el contacto" };
  }
}

/**
 * Quitar contacto de carpeta
 */
export async function removeContactFromFolder(data: {
  contactId: string;
  folderId: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autenticado" };
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
      return { success: false, error: "Contacto o carpeta inválidos" };
    }

    await db
      .delete(contactFolderMembers)
      .where(
        and(
          eq(contactFolderMembers.contactId, data.contactId),
          eq(contactFolderMembers.folderId, data.folderId),
        ),
      );

    return { success: true };
  } catch (error) {
    logger.error("Failed to remove contact from folder", error as Error, {
      contactId: data.contactId,
      folderId: data.folderId,
    });
    return { success: false, error: "Error al quitar el contacto" };
  }
}

/**
 * Buscar contacto por CBU o Alias
 */
export async function searchContactByCBUOrAlias(
  cbuOrAlias: string,
): Promise<{ success: boolean; data?: Contact; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autenticado" };
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
      return { success: false, error: "Contacto no encontrado" };
    }

    return { success: true, data: result[0] as any };
  } catch (error) {
    logger.error("Failed to search contact by CBU/Alias", error as Error, {
      cbuOrAlias,
    });
    return {
      success: false,
      error: "Error al buscar el contacto",
    };
  }
}

/**
 * Actualizar un contacto
 */
export async function updateContact(
  contactId: string,
  data: Partial<Contact>,
): Promise<{ success: boolean; data?: Contact; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autenticado" };
    }

    // Verificar que pertenece al usuario
    const existingContact = await db
      .select()
      .from(contacts)
      .where(
        and(eq(contacts.id, contactId), eq(contacts.userId, session.user.id)),
      );

    if (existingContact.length === 0) {
      return { success: false, error: "Contacto no encontrado" };
    }

    const updated = await db
      .update(contacts)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(contacts.id, contactId))
      .returning();

    return { success: true, data: updated[0] as any };
  } catch (error) {
    logger.error("Failed to update contact", error as Error, {
      userId: session.user.id,
      contactId,
    });
    return {
      success: false,
      error: "Error al actualizar el contacto",
    };
  }
}

/**
 * Eliminar un contacto
 */
export async function deleteContact(
  contactId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autenticado" };
    }

    // Verificar que pertenece al usuario
    const existingContact = await db
      .select()
      .from(contacts)
      .where(
        and(eq(contacts.id, contactId), eq(contacts.userId, session.user.id)),
      );

    if (existingContact.length === 0) {
      return { success: false, error: "Contacto no encontrado" };
    }

    await db.delete(contacts).where(eq(contacts.id, contactId));

    return { success: true };
  } catch (error) {
    logger.error("Failed to delete contact", error as Error, {
      userId: session.user.id,
      contactId,
    });
    return {
      success: false,
      error: "Error al eliminar el contacto",
    };
  }
}
