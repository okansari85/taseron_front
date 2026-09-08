f = "app/pages/tenants/[tenantId]/locations/index.vue"
s = open(f, encoding='utf-8').read()
old = "const filteredLocations=computed(()=>{const t=search.value.trim().toLocaleLowerCase('tr-TR');return locations.value.filter(x=>{const h=`${x.name} ${x.city} ${x.district} ${x.address} ${x.businessEntities.map(e=>`${e.companyName} ${e.brandName||''}`).join(' ')}`.toLocaleLowerCase('tr-TR');return(!t||h.includes(t))&&(companyFilter.value==='all'||x.businessEntities.some(e=>e.companyName===companyFilter.value))&&(cityFilter.value==='all'||x.city===cityFilter.value)&&(statusFilter.value==='all'||x.status===statusFilter.value)})})"
new = "const filteredLocations=computed(()=>{const t=search.value.trim().toLocaleLowerCase('tr-TR');return locations.value.filter(x=>{const h=`${x.name} ${x.city} ${x.district} ${x.address} ${x.businessEntities.map(e=>`${e.companyName} ${(e.brands||[]).map(b=>b.name).join(' ')}`).join(' ')}`.toLocaleLowerCase('tr-TR');return(!t||h.includes(t))&&(companyFilter.value==='all'||x.businessEntities.some(e=>e.companyName===companyFilter.value))&&(cityFilter.value==='all'||x.city===cityFilter.value)&&(statusFilter.value==='all'||x.status===statusFilter.value)})})"
assert old in s, 'pattern not found'
s = s.replace(old, new)
open(f, 'w', encoding='utf-8').write(s)
print('OK')
