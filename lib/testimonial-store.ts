import { randomUUID } from "crypto";
import { db, withDb } from "@/lib/db";

// Testimonios enviados por clientes desde /opina. Nunca se publican solos:
// entran como "pendiente" y la administración los aprueba o rechaza en el
// panel. El correo es solo para contacto interno: jamás se muestra en el sitio.

export type TestimonialStatus = "pendiente" | "aprobado" | "rechazado";

export interface Testimonial {
  id: string;
  name: string;
  email: string;
  rating: number;
  quote: string;
  status: TestimonialStatus;
  createdAt: string;
  reviewedAt?: string;
}

const g = globalThis as unknown as { __testimonials?: Testimonial[] };
const mem = () => (g.__testimonials ??= []);

function row(r: Record<string, unknown>): Testimonial {
  return {
    id: String(r.id),
    name: String(r.name),
    email: String(r.email),
    rating: Number(r.rating),
    quote: String(r.quote),
    status: r.status as TestimonialStatus,
    createdAt: new Date(r.created_at as string).toISOString(),
    reviewedAt: r.reviewed_at ? new Date(r.reviewed_at as string).toISOString() : undefined,
  };
}

export async function addTestimonial(data: { name: string; email: string; rating: number; quote: string }): Promise<Testimonial> {
  const t: Testimonial = { ...data, id: randomUUID(), status: "pendiente", createdAt: new Date().toISOString() };
  await withDb(
    async () => {
      const sql = db();
      await sql`INSERT INTO testimonials (id, name, email, rating, quote, status, created_at)
        VALUES (${t.id}, ${t.name}, ${t.email}, ${t.rating}, ${t.quote}, ${t.status}, ${t.createdAt})`;
    },
    () => {
      mem().push(t);
    }
  );
  return t;
}

export async function listTestimonials(status?: TestimonialStatus): Promise<Testimonial[]> {
  return withDb(
    async () => {
      const sql = db();
      const rows = status
        ? await sql`SELECT * FROM testimonials WHERE status = ${status} ORDER BY created_at DESC`
        : await sql`SELECT * FROM testimonials ORDER BY created_at DESC`;
      return rows.map(row);
    },
    () => mem().filter((t) => !status || t.status === status).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );
}

// Moderación: cambiar estado y, opcionalmente, ajustar nombre/texto antes de
// publicar (ej. "Carolina Rojas" → "Carolina R.", corregir un error de tipeo).
export async function reviewTestimonial(id: string, patch: { status?: TestimonialStatus; name?: string; quote?: string; rating?: number }): Promise<void> {
  const reviewedAt = new Date().toISOString();
  await withDb(
    async () => {
      const sql = db();
      const fields: Record<string, unknown> = {};
      if (patch.status) Object.assign(fields, { status: patch.status, reviewed_at: reviewedAt });
      if (patch.name !== undefined) fields.name = patch.name.trim();
      if (patch.quote !== undefined) fields.quote = patch.quote.trim();
      if (patch.rating !== undefined) fields.rating = patch.rating;
      if (Object.keys(fields).length) await sql`UPDATE testimonials SET ${sql(fields)} WHERE id = ${id}`;
    },
    () => {
      const t = mem().find((x) => x.id === id);
      if (t) Object.assign(t, patch, patch.status ? { reviewedAt } : {});
    }
  );
}

export async function deleteTestimonial(id: string): Promise<void> {
  await withDb(
    async () => {
      const sql = db();
      await sql`DELETE FROM testimonials WHERE id = ${id}`;
    },
    () => {
      g.__testimonials = mem().filter((t) => t.id !== id);
    }
  );
}
