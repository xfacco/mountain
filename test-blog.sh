#!/bin/bash

echo "🧪 Testing Blog Implementation..."
echo ""

# Check if files exist
echo "📁 Checking files..."
files=(
    "frontend/src/app/blog/page.tsx"
    "frontend/src/app/blog/[slug]/page.tsx"
    "frontend/src/app/blog/[slug]/BlogPostClient.tsx"
    "frontend/src/app/alpeadminmatch/BlogManagement.tsx"
    "frontend/src/types/blog.ts"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file - NOT FOUND"
    fi
done

echo ""
echo "🔍 Checking integrations..."

# Check Footer integration
if grep -q "href=\"/blog\"" frontend/src/components/layout/Footer.tsx; then
    echo "✅ Blog link in Footer"
else
    echo "❌ Blog link NOT in Footer"
fi

# Check Admin integration
if grep -q "BlogManagement" frontend/src/app/alpeadminmatch/page.tsx; then
    echo "✅ BlogManagement in Admin"
else
    echo "❌ BlogManagement NOT in Admin"
fi

# Check translations
if grep -q "\"Blog\":" frontend/src/messages/en.json; then
    echo "✅ Blog translations in en.json"
else
    echo "❌ Blog translations NOT in en.json"
fi

echo ""
echo "🎉 Blog implementation check complete!"
echo ""
echo "📝 Next steps:"
echo "1. Visit http://localhost:3000/blog to see the blog homepage"
echo "2. Visit http://localhost:3000/alpeadminmatch and click 'Gestione Blog'"
echo "3. Create your first blog post!"
echo ""
