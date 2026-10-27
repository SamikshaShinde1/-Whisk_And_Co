// The full menu: categories, items, prices (₹) and photos.
//
// HOW TO USE YOUR OWN PHOTO
// 1. Put the photo in client/public/images, e.g. client/public/images/red-velvet.jpg
// 2. Change that item's image to:  image: '/images/red-velvet.jpg'

// Builds a link to a free Unsplash photo from its id.
export const unsplash = (id, width = 800) =>
  `https://images.unsplash.com/photo-${id}?w=${width}&q=80&auto=format&fit=crop`

// "tone" is the colour shown behind the emoji if a photo can't load.
export const CATEGORIES = [
  { id: 'cakes', name: 'Cakes', emoji: '🎂', tone: '#f6d6cf' },
  { id: 'pastries', name: 'Pastries & Cupcakes', emoji: '🧁', tone: '#eeb5b0' },
  { id: 'breads', name: 'Breads', emoji: '🍞', tone: '#e7cfa8' },
  { id: 'cookies', name: 'Cookies', emoji: '🍪', tone: '#ead9bf' },
  { id: 'desserts', name: 'Desserts', emoji: '🍰', tone: '#f3c9bf' },
  { id: 'beverages', name: 'Beverages', emoji: '☕', tone: '#d9c2a7' },
]

export const MENU = [
  // ---------- Cakes ----------
  {
    id: 'chocolate-truffle-cake',
    name: 'Chocolate Truffle Cake',
    category: 'cakes',
    price: 650,
    unit: '500 g',
    bestSeller: true,
    image: unsplash('1569580990590-478357ea38ab'),
    description: 'Layers of moist chocolate sponge wrapped in a silky dark chocolate truffle ganache. Pure, rich, chocolatey happiness.',
  },
  {
    id: 'red-velvet-cake',
    name: 'Red Velvet Cake',
    category: 'cakes',
    price: 700,
    unit: '500 g',
    bestSeller: true,
    image: unsplash('1621955511667-e2c316e4575d'),
    description: 'Soft, velvety crimson layers with a hint of cocoa, finished with smooth and tangy cream cheese frosting.',
  },
  {
    id: 'black-forest-cake',
    name: 'Black Forest Cake',
    category: 'cakes',
    price: 600,
    unit: '500 g',
    image: unsplash('1605807646837-485a3bc9bf1b'),
    description: 'The classic: chocolate sponge, clouds of fresh whipped cream, juicy cherries and a shower of chocolate shavings.',
  },
  {
    id: 'butterscotch-cake',
    name: 'Butterscotch Cake',
    category: 'cakes',
    price: 550,
    unit: '500 g',
    image: unsplash('1547414368-ac947d00b91d'),
    description: 'Light vanilla sponge with golden butterscotch cream and crunchy caramel praline in every bite.',
  },
  {
    id: 'custom-birthday-cake',
    name: 'Custom Birthday Cake',
    category: 'cakes',
    price: 900,
    priceFrom: true,
    unit: '1 kg',
    image: unsplash('1577998474517-7eeeed4e448a'),
    description: 'Your theme, your flavour, your colours. Tell us your idea and we will bake a one-of-a-kind cake for your celebration.',
  },

  // ---------- Pastries & Cupcakes ----------
  {
    id: 'chocolate-cupcake',
    name: 'Chocolate Cupcake',
    category: 'pastries',
    price: 60,
    unit: 'piece',
    image: unsplash('1563729784474-d77dbb933a9e'),
    description: 'A fudgy chocolate cupcake crowned with a generous swirl of chocolate buttercream.',
  },
  {
    id: 'vanilla-cupcake',
    name: 'Vanilla Cupcake',
    category: 'pastries',
    price: 50,
    unit: 'piece',
    image: unsplash('1615837136007-701de6015cfb'),
    description: 'Fluffy vanilla bean cupcake topped with a soft, pastel buttercream. Simple and sweet.',
  },
  {
    id: 'blueberry-muffin',
    name: 'Blueberry Muffin',
    category: 'pastries',
    price: 70,
    unit: 'piece',
    image: unsplash('1576618148400-f54bed99fcfd'),
    description: 'A tall, golden muffin bursting with juicy blueberries and a crunchy sugar top.',
  },
  {
    id: 'red-velvet-cupcake',
    name: 'Red Velvet Cupcake',
    category: 'pastries',
    price: 60,
    unit: 'piece',
    image: unsplash('1621866908241-bc59b9dbfe7c'),
    description: 'Our red velvet in mini form, topped with a cloud of cream cheese frosting.',
  },

  // ---------- Breads ----------
  {
    id: 'sourdough',
    name: 'Sourdough',
    category: 'breads',
    price: 180,
    unit: 'loaf',
    image: unsplash('1549413468-cd78edb7e75c'),
    description: 'Slow-fermented for a deep flavour, with a crackly golden crust and a soft, airy, tangy inside.',
  },
  {
    id: 'multigrain-bread',
    name: 'Multigrain Bread',
    category: 'breads',
    price: 90,
    unit: 'loaf',
    image: unsplash('1509440159596-0249088772ff'),
    description: 'A wholesome loaf packed with seeds and grains. Perfect for toast and sandwiches.',
  },
  {
    id: 'whole-wheat-bread',
    name: 'Whole Wheat Bread',
    category: 'breads',
    price: 70,
    unit: 'loaf',
    image: unsplash('1608198093002-ad4e005484ec'),
    description: 'Soft everyday loaf made with whole wheat flour. Light, healthy and freshly baked.',
  },
  {
    id: 'garlic-bread',
    name: 'Garlic Bread',
    category: 'breads',
    price: 120,
    unit: 'pack',
    image: unsplash('1534620808146-d33bb39128b2'),
    description: 'Buttery, garlicky and full of herbs. Just warm it up and enjoy.',
  },
  {
    id: 'baguette',
    name: 'Baguette',
    category: 'breads',
    price: 100,
    unit: 'piece',
    image: unsplash('1586765501019-cbe3973ef8fa'),
    description: 'A long French-style loaf with a crisp, crackly crust and a chewy centre.',
  },

  // ---------- Cookies ----------
  {
    id: 'chocolate-chip-cookies',
    name: 'Chocolate Chip Cookies',
    category: 'cookies',
    price: 250,
    unit: 'box of 12',
    bestSeller: true,
    image: unsplash('1499636136210-6f4ee915583e'),
    description: 'Crisp edges, chewy middles and puddles of melted chocolate. The cookie everyone comes back for.',
  },
  {
    id: 'oatmeal-cookies',
    name: 'Oatmeal Cookies',
    category: 'cookies',
    price: 220,
    unit: 'box of 12',
    image: unsplash('1558961363-fa8fdf82db35'),
    description: 'Hearty, chewy oat cookies with a warm hint of cinnamon.',
  },
  {
    id: 'butter-cookies',
    name: 'Butter Cookies',
    category: 'cookies',
    price: 200,
    unit: 'box of 12',
    image: unsplash('1598839950984-034f6dc7b495'),
    description: 'Classic melt-in-the-mouth butter cookies. Perfect with a cup of tea.',
  },
  {
    id: 'almond-cookies',
    name: 'Almond Cookies',
    category: 'cookies',
    price: 280,
    unit: 'box of 12',
    image: unsplash('1597733153203-a54d0fbc47de'),
    description: 'Golden, crunchy cookies loaded with roasted almonds.',
  },
  {
    id: 'assorted-cookie-box',
    name: 'Assorted Cookie Box',
    category: 'cookies',
    price: 450,
    unit: 'box of 24',
    image: unsplash('1583743089695-4b816a340f82'),
    description: 'A little bit of everything: our favourite cookies in one pretty box. A perfect gift.',
  },

  // ---------- Desserts ----------
  {
    id: 'fudge-brownie',
    name: 'Fudge Brownie',
    category: 'desserts',
    price: 80,
    unit: 'piece',
    image: unsplash('1606313564200-e75d5e30476c'),
    description: 'Dense, gooey and intensely chocolatey, with a crackly top. Our signature bake.',
  },
  {
    id: 'cheesecake',
    name: 'Cheesecake',
    category: 'desserts',
    price: 220,
    unit: 'slice',
    image: unsplash('1533134242443-d4fd215305ad'),
    description: 'Creamy, velvety baked cheesecake on a buttery biscuit base.',
  },
  {
    id: 'tiramisu',
    name: 'Tiramisu',
    category: 'desserts',
    price: 200,
    unit: 'cup',
    image: unsplash('1676300185983-d5f242babe34'),
    description: 'Coffee-soaked sponge layered with light mascarpone cream and dusted with cocoa.',
  },
  {
    id: 'chocolate-lava-cake',
    name: 'Chocolate Lava Cake',
    category: 'desserts',
    price: 150,
    unit: 'piece',
    image: unsplash('1606313564573-104197cf8f91'),
    description: 'A warm chocolate cake with a molten, gooey centre that flows out with the first spoonful.',
  },

  // ---------- Beverages ----------
  {
    id: 'coffee',
    name: 'Coffee',
    category: 'beverages',
    price: 120,
    unit: 'cup',
    image: unsplash('1509042239860-f550ce710b93'),
    description: 'Freshly brewed, smooth and aromatic. The perfect partner for any bake.',
  },
  {
    id: 'tea',
    name: 'Tea',
    category: 'beverages',
    price: 60,
    unit: 'cup',
    image: unsplash('1610632380989-680fe40816c6'),
    description: 'A comforting cup of hot, fragrant tea.',
  },
  {
    id: 'hot-chocolate',
    name: 'Hot Chocolate',
    category: 'beverages',
    price: 150,
    unit: 'cup',
    image: unsplash('1511920170033-f8396924c348'),
    description: 'Thick, creamy and made with real cocoa. A hug in a mug.',
  },
]

// Other photos used on the Home page
export const CRAFT_IMAGE = unsplash('1517686469429-8bdb88b9f907', 1000)

// ---------- Helpers ----------
export const BEST_SELLERS = MENU.filter((item) => item.bestSeller)

export function getItem(id) {
  return MENU.find((item) => item.id === id)
}

export function getCategory(id) {
  return CATEGORIES.find((category) => category.id === id)
}

// 650 -> "₹650", and "From ₹900" for items with a starting price
export function formatPrice(amount, from = false) {
  return `${from ? 'From ' : ''}₹${amount.toLocaleString('en-IN')}`
}
