import { config } from 'dotenv'

// Point tests at the dedicated test database, not the real dev one, so
// running the suite never touches (or wipes) real local data.
config({ path: '.env.test' })
