import { db } from '@/src/db/db';
import { openai } from '@ai-sdk/openai';
import { streamText, UIMessage, convertToModelMessages, tool, stepCountIs } from 'ai';
import { z } from 'zod';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const SYSTEM_PROMPT = `You are an expert SQL assistant that helps users to query their database using natural language.
      ${new Date().toLocaleDateString('sv-SE')}
      You have access to following tools:
      1. schema tool -- call this tool to get the database schema which will help you to write SQL query.
      2. db tool -- call this tool to query the database.

      Rules:
      - Generate ONLY SELECT queries (no INSERT, UPDATE, DELETE, DROP)
      - Always use the schema provide by schema tool.
      - Pass in valid SQL systax queries in db tool.
      -IMPORTANT: To query databse call db tool,Don't return just SQL query.

      Always respond in a helpful, conversational tone while being technically accurate.`;


  const result = streamText({
    model: openai('gpt-4o-mini'),
    messages: convertToModelMessages(messages),
    system: SYSTEM_PROMPT,
    stopWhen: stepCountIs(5),
    tools: {
        schema: tool({
        description: 'Call this tool to get database scehma', 
        inputSchema: z.object({
          query: z.string().describe('The SQL query to be ran.'),
        }),
        execute: async ({ query }) => {
            console.log("Received query:", query);
            return `
                id: integer('id').primaryKey({ autoIncrement: true }),
                name: text('name').notNull(),
                category: text('category').notNull(),
                price: real('price').notNull(),
                stock: integer('stock').notNull().default(0),
                created_at: text('created_at').default(sql\`CURRENT_TIMESTAMP\`),
              });

              // Sales table
              export const salesTable = sqliteTable('sales', {
                id: integer('id').primaryKey({ autoIncrement: true }),
                product_id: integer('product_id')
                  .notNull()
                  .references(() => productsTable.id),
                quantity: integer('quantity').notNull(),
                total_amount: real('total_amount').notNull(),
                sale_date: text('sale_date').default(sql\`CURRENT_TIMESTAMP\`),
                customer_name: text('customer_name').notNull(),
                region: text('region').notNull(),
              });
              `;
          
        },  
        }),
      db: tool({
        description: 'Call this tool to query a database',
        inputSchema: z.object({
          query: z.string().describe('The SQL query to be ran.'),
        }),
        execute: async ({ query }) => {
            console.log("Received query:", query);
            //important: make sure to sanitize /valide query ,string search only etc to avoid harmful queries(use  regex to check whether delete,update exists or not ) 
            return await db.run(query);
            
          
        },  
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
