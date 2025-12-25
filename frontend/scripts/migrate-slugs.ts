/**
 * Migration script to add slug field to all locations in Firestore
 * Run this with: npx tsx scripts/migrate-slugs.ts
 */

import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../src/lib/firebase';

function locationNameToSlug(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

async function migrateLocations() {
    console.log('🚀 Starting migration...\n');

    try {
        const locationsRef = collection(db, 'locations');
        const snapshot = await getDocs(locationsRef);

        console.log(`📊 Found ${snapshot.docs.length} locations in database\n`);

        let updated = 0;
        let skipped = 0;
        let errors = 0;

        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            const locationName = data.name;

            if (!locationName) {
                console.log(`⚠️  Skipping document ${docSnap.id} - no name field`);
                skipped++;
                continue;
            }

            // Check if slug already exists
            if (data.slug) {
                console.log(`⏭️  Skipping "${locationName}" - slug already exists: ${data.slug}`);
                skipped++;
                continue;
            }

            const slug = locationNameToSlug(locationName);

            try {
                await updateDoc(doc(db, 'locations', docSnap.id), {
                    slug: slug
                });
                console.log(`✅ Updated "${locationName}" -> "${slug}"`);
                updated++;
            } catch (error) {
                console.error(`❌ Error updating "${locationName}":`, error);
                errors++;
            }
        }

        console.log(`\n${'='.repeat(50)}`);
        console.log('📈 Migration Summary:');
        console.log(`${'='.repeat(50)}`);
        console.log(`✅ Updated: ${updated}`);
        console.log(`⏭️  Skipped: ${skipped}`);
        console.log(`❌ Errors: ${errors}`);
        console.log(`📊 Total: ${snapshot.docs.length}`);
        console.log(`${'='.repeat(50)}\n`);

        if (updated > 0) {
            console.log('🎉 Migration completed successfully!');
        } else if (skipped === snapshot.docs.length) {
            console.log('ℹ️  All locations already have slugs - nothing to update');
        }

    } catch (error) {
        console.error('💥 Migration failed with error:', error);
        throw error;
    }
}

// Run migration
migrateLocations()
    .then(() => {
        console.log('\n✨ Script finished');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Script failed:', error);
        process.exit(1);
    });
