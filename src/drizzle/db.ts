// import "dotenv/config"

// import { drizzle } from "drizzle-orm/node-postgres"
// import { Client } from "pg"
// import * as schema from "./schema"

// export const client = new Client({
//     connectionString: process.env.Database_URL as string   //must match name used in .env
// })

// const main = async () => {
//     await client.connect()
// }
// main().then(() => {
//     console.log("Connected to the database")
// }).catch((error) => {
//     console.error("Error connecting to the database:", error)
// })


// const db = drizzle(client, { schema, logger: false })

//export default db;
import 'dotenv/config'; // Keep this at the very top
import { neon } from '@neondatabase/serverless'; // Import neon client from its package
import { drizzle } from 'drizzle-orm/neon-http'; // Import drizzle specifically for neon-http
import * as schema from './schema';

export const client = neon(process.env.Database_URL!)

const db = drizzle(client, { schema, logger: false });
export default db;