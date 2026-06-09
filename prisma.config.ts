import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'src/prisma/schema.prisma',
  datasource: { 
    url: "postgresql://postgres.ijlxuqqqkcmfrmxchabe:Gue.retro1234@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1&pool_timeout=20&connect_timeout=10"
  },
})