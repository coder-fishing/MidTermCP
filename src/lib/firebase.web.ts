import { getAuth } from 'firebase/auth';

import { app, db } from './firebase-core';

export { app, db };
export const auth = getAuth(app);
