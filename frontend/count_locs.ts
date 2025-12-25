
import { db } from './src/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

async function count() {
    const q = await getDocs(collection(db, 'locations'));
    console.log('Total locations:', q.size);
}

count();
