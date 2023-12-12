'use server';

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const FormSchema = z.object({
  id: z.string(),
  customer_id: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });

// This is temporary until @types/react-dom is updated
export type State = {
    errors?: {
      customer_id?: string[];
      amount?: string[];
      status?: string[];
    };
    message?: string | null;
  };

export async function createInvoice(_prevState: State, formData: FormData) {
  try {
    const validatedFields = CreateInvoice.safeParse({
      customer_id: formData.get('customerId'),
      amount: formData.get('amount'),
      status: formData.get('status'),
    });

    if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }
    const { amount, customer_id, status } = validatedFields.data;

    const amountInCents = amount * 100;
    const date = new Date().toISOString();

    await sql`
                INSERT INTO invoices (
                    customer_id,
                    amount,
                    status,
                    date
                ) VALUES (
                    ${customer_id},
                    ${amountInCents},
                    ${status},
                    ${date}
                ) 
            `;
     

  } catch (error: unknown) {
    console.error(error);
    // return {
    //    message: 'Error when creating invoices',
    // };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

const EditInvoice = FormSchema.omit({ date: true });

export async function editInvoice(incomingId: string, _prevState: State, formData: FormData) {
  try {
    const validatedFields = EditInvoice.safeParse({
      id: incomingId,
      customer_id: formData.get('customerId'),
      amount: formData.get('amount'),
      status: formData.get('status'),
    })

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Edit Invoice.',
        }
    }

    const { id, customer_id, amount, status } = validatedFields.data;

    const amountInCents = amount * 100;

    await sql`
        UPDATE invoices
        SET
            customer_id = ${customer_id},
            amount = ${amountInCents},
            status = ${status}
        WHERE
            id = ${id}
    `;
  } catch (err) {
    console.error(err);
    return {
      message: 'Error when updating invoices',
    };
  }
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  try {
    await sql`
                DELETE FROM invoices
                WHERE
                    id = ${id}
            `;
  } catch (err) {
    console.error(err);
    return {
      message: 'Error when deleting invoices',
    };
  }
  revalidatePath('/dashboard/invoices');
}
