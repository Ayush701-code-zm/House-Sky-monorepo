import re

with open('app/list-your-property/page.tsx', 'r') as f:
    content = f.read()

# Replace simple classNames
content = re.sub(
    r'className="w-full bg-\[\#FAF9F6\] border border-brand-green/20 text-brand-charcoal[^"]*"',
    r'className="input-base"',
    content
)

# Replace template literals
def replacer(match):
    full_match = match.group(0)
    full_match = re.sub(
        r'w-full bg-\[\#FAF9F6\] border text-brand-charcoal[^$]*\$',
        r'input-base $',
        full_match
    )
    full_match = full_match.replace("'border-red-500 ring-red-500/20'", "'hs-input-error'")
    full_match = full_match.replace("'border-red-500 focus:border-red-500 focus:ring-red-100'", "'hs-input-error'")
    full_match = full_match.replace("'border-brand-green/20 focus:border-brand-green'", "''")
    full_match = full_match.replace("'border-brand-green/20 focus:border-brand-green focus:ring-brand-green/10'", "''")
    return full_match

content = re.sub(
    r'className={`w-full bg-\[\#FAF9F6\] border text-brand-charcoal[^`]*`}',
    replacer,
    content
)

# Replace any lingering bg-[#FAF9F6] in similar blocks
content = re.sub(
    r'bg-\[\#FAF9F6\] border border-brand-green/15 rounded-2xl p-4',
    r'bg-white border border-brand-green/20 rounded-2xl p-4',
    content
)

content = re.sub(
    r'className="block text-\[11px\] font-extrabold uppercase tracking-wider text-brand-charcoal/70 mb-2"',
    r'className="hs-label"',
    content
)

content = re.sub(
    r'className="text-xs font-bold text-brand-charcoal/80 block"',
    r'className="hs-label"',
    content
)

content = re.sub(
    r'className="text-\[10px\] text-red-500 font-bold mt-1\.5 flex items-center gap-1"',
    r'className="hs-field-error"',
    content
)

with open('app/list-your-property/page.tsx', 'w') as f:
    f.write(content)

print("Done")
