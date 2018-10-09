const express = require('express')
const router = express.Router()

router.get('/:nickname/publication/:pubid/document/:docid', function (
  req,
  res,
  next
) {
  const nickname = req.params.nickname
  const pubid = req.params.pubid
  const docid = req.params.docid
  const host = req.headers.host

  res.setHeader(
    'Content-Type',
    'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
  )

  res.end(
    JSON.stringify({
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'Document',
      id: `https://${host}/${nickname}/publication/${pubid}/document/${docid}`,
      name: `Publication ${pubid} Document ${docid}`,
      content:
        '<!DOCTYPE html>' +
        `<html><head><title>Publication ${pubid} Document ${docid}</title></head>` +
        '<body>' +
        '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec et augue convallis, gravida felis id, congue nulla. Quisque est nisi, pharetra non fringilla nec, rhoncus et lorem. Sed dictum suscipit metus, vel tempus enim fringilla id. Sed ac diam est. In cursus gravida mauris vitae aliquam. In rutrum, ante et malesuada fermentum, lorem nisi efficitur nunc, ac iaculis odio nulla at elit. Cras mollis lectus vitae euismod iaculis. Vivamus vel laoreet massa, id aliquam velit. Cras at leo nec nisi bibendum cursus. Vivamus sit amet mauris id risus pellentesque aliquet. Nunc malesuada, turpis ut molestie rutrum, nunc dolor tempor sem, quis fringilla lectus massa a justo. Morbi lobortis, mauris ac condimentum faucibus, orci metus laoreet est, quis condimentum magna erat ut turpis. Phasellus elementum ac lacus vitae porttitor. Quisque at porttitor neque, porttitor ullamcorper tellus. Morbi mattis, libero eget commodo feugiat, metus elit ornare nunc, consequat convallis elit massa id justo.</p>' +
        '<p>Nam volutpat commodo ex nec porttitor. Morbi nunc orci, consectetur non volutpat at, volutpat eu lectus. Etiam consequat commodo erat. In posuere lorem ultrices, finibus eros vitae, rutrum nulla. Sed auctor euismod euismod. Praesent non tempor augue. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Etiam egestas metus ut eleifend euismod. Proin dignissim erat sem, in placerat dolor cursus vitae. Nunc sed auctor lectus. Praesent auctor id ligula vitae interdum. Pellentesque hendrerit lacus nisl, eu consequat turpis blandit non.</p>' +
        '<p>Maecenas aliquet id ex a tempus. In tempus luctus est semper congue. Aenean et feugiat est. Donec scelerisque a sapien auctor rhoncus. Praesent volutpat, dui et scelerisque rhoncus, nibh libero condimentum augue, non pretium augue erat in arcu. Proin non dolor vitae ante mattis consequat ut sit amet est. Proin tincidunt felis enim, et imperdiet nibh lobortis non. Vivamus laoreet blandit purus, at dignissim lorem hendrerit nec. Nam at risus ut neque ornare laoreet congue vel purus. Pellentesque a dapibus nisi, nec scelerisque arcu. Duis sed ultricies augue, sed pellentesque ipsum. Proin pulvinar pulvinar mauris vitae bibendum.</p>' +
        '<p>Duis non rhoncus turpis, eget lobortis ex. Nullam velit nibh, imperdiet non augue ac, ultrices fermentum ante. Suspendisse eu nisi et tellus aliquam feugiat tristique vitae risus. Sed sit amet facilisis mi. Pellentesque mattis molestie posuere. Quisque commodo, lorem eget ullamcorper iaculis, mauris dui tincidunt ante, at vehicula quam sapien sed risus. Pellentesque sit amet ex sem. Ut quis efficitur lectus. Phasellus arcu augue, pretium vel gravida vel, venenatis quis dolor. Vestibulum sapien sem, mollis nec sapien auctor, sagittis vehicula ante.</p>' +
        '<p>Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Suspendisse ullamcorper arcu nec odio rutrum, a placerat odio ullamcorper. Aliquam accumsan eros eget malesuada faucibus. Curabitur pharetra in nisi tristique blandit. Ut consequat cursus dui eget volutpat. Quisque purus diam, consectetur nec aliquam vitae, sodales non massa. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.</p>' +
        '</body>' +
        '</html'
    })
  )
})

module.exports = router
