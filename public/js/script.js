// Constantes
const API_URL = 'http://localhost:8800/api';

// Estado da aplicação
let currentUser = null;
let featuredProperties = [];
let recommendedProperties = [];

// Variáveis globais necessárias para filtros e paginação
let currentFilters = {};
let currentPage = 1;
let totalPages = 1;

// Elementos DOM
const propertiesContainer = document.querySelector('#featured-property');
if (propertiesContainer) {
  // Código que usa propertiesContainer
}
const recommendedContainer = document.querySelector('#recommended-properties');
if (recommendedContainer) {
  // Código que usa recommendedContainer
}
const allPropertiesContainer = document.getElementById('allProperties');
const searchForm = document.querySelector('#search-form');
const loginForm = document.querySelector('#login-form');
const registerForm = document.querySelector('#register-form');

// Funções de API
async function fetchFeaturedProperties() {
  try {
    const response = await fetch(`${API_URL}/posts/featured`);
    if (!response.ok) throw new Error('Failed to fetch featured properties');
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

async function fetchRecommendedProperties() {
  try {
    const response = await fetch(`${API_URL}/posts/recommended`);
    if (!response.ok) throw new Error('Failed to fetch recommended properties');
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

async function searchProperties(queryParams) {
  try {
    const queryString = new URLSearchParams(queryParams).toString();
    const response = await fetch(`${API_URL}/posts?${queryString}`);
    if (!response.ok) throw new Error('Failed to search properties');
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    return { posts: [], pagination: { total: 0, page: 1, pages: 0 } };
  }
}

async function login(email, password) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

async function register(userData) {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Registration failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

async function saveProperty(postId) {
  try {
    const response = await fetch(`${API_URL}/posts/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId }),
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to save property');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error saving property:', error);
    throw error;
  }
}

// Function to fetch saved/favorite properties
async function fetchSavedProperties() {
  if (!token) return [];
  try {
    const response = await fetch(`${API_URL}/posts/user/saved`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch saved properties');
    const data = await response.json();
    const ids = data.map(post => post.id);
    console.log('[fetchSavedProperties] IDs favoritos:', ids);
    return ids;
  } catch (error) {
    console.error('Error fetching saved properties:', error);
    return [];
  }
}

// Função para buscar todas as propriedades (listings)
async function fetchAllProperties(page = 1, filters = {}) {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('limit', 30);

    if (!filters.sort) {
      queryParams.append('sort', 'createdAt');
      queryParams.append('order', 'desc');
    }
    if (filters.city) queryParams.append('city', filters.city);
    if (filters.minPrice) queryParams.append('minPrice', filters.minPrice);
    if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice);
    if (filters.bedrooms) queryParams.append('bedrooms', filters.bedrooms);
    if (filters.bathrooms) queryParams.append('bathrooms', filters.bathrooms);
    if (filters.minArea) queryParams.append('minArea', filters.minArea);
    if (filters.maxArea) queryParams.append('maxArea', filters.maxArea);
    if (filters.sort) queryParams.append('sort', filters.sort);
    if (filters.order) queryParams.append('order', filters.order);
    if (filters.title) queryParams.append('title', filters.title);

    const response = await fetch(`${API_URL}/posts?${queryParams.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch properties');
    return await response.json();
  } catch (error) {
    console.error('Error fetching properties:', error);
    return { posts: [], pagination: { total: 0, page: 1, pages: 1 } };
  }
}

// Funções para renderizar elementos na página
function renderFeaturedProperty(property) {
  return `
    <div class="card relative">
      <img src="${property.images[0] || '/api/placeholder/800/400'}" alt="${property.title}" class="w-full" onerror="this.onerror=null; this.src='/api/placeholder/800/400';">
      <div class="absolute top-3 right-3 bg-white p-2 rounded-full favorite-btn" data-id="${property.id}">
        <i class="far fa-heart text-gray-500"></i>
      </div>
      <div class="p-4">
        <div class="flex justify-between mb-2">
          <h3 class="font-bold text-lg">${property.title}</h3>
          <span class="text-blue-500 font-bold">$${property.price.toLocaleString()}</span>
        </div>
        <p class="text-gray-500 mb-3">${property.address}, ${property.city}</p>
        <div class="flex space-x-2 mb-3">
          <span class="feature-badge">
            <i class="fas fa-bed mr-1"></i> ${property.bedroom}
          </span>
          <span class="feature-badge">
            <i class="fas fa-bath mr-1"></i> ${property.bathroom}
          </span>
          <span class="feature-badge">
            <i class="fas fa-ruler-combined mr-1"></i> ${property.area} sqft
          </span>
        </div>
        <button class="btn-primary text-white font-medium w-full view-property" data-id="${property.id}">View Details</button>
      </div>
    </div>
  `;
}

function renderPropertyCard(property) {
  // Garante que a cor do coração depende apenas de property.isFavorite
  let imageUrl = '/api/placeholder/400/300';
  if (property.images && property.images.length > 0) {
    if (property.images[0].startsWith('http') || property.images[0].startsWith('/uploads/')) {
      imageUrl = property.images[0];
    } else {
      imageUrl = `/api/uploads/listings/${property.images[0]}`;
    }
  }
  return `
    <div class="card">
      <div class="relative">
        <img src="${imageUrl}" alt="${property.title}" class="property-image w-full" onerror="this.onerror=null; this.src='/api/placeholder/400/300';">
        <button class="favorite-btn absolute top-3 right-3 bg-white p-2 rounded-full" data-id="${property.id}">
          <i class="fas fa-heart${property.isFavorite ? ' text-red-500' : ' text-gray-500'}"></i>
        </button>
      </div>
      <div class="p-3">
        <div class="flex justify-between mb-1">
          <h3 class="font-bold">${property.title}</h3>
          <span class="text-blue-500 font-bold">$${property.price.toLocaleString()}</span>
        </div>
        <p class="text-gray-500 text-sm mb-2">${property.address}, ${property.city}</p>
        <div class="flex space-x-2">
          <span class="feature-badge">
            <i class="fas fa-bed mr-1"></i> ${property.bedroom}
          </span>
          <span class="feature-badge">
            <i class="fas fa-bath mr-1"></i> ${property.bathroom}
          </span>
          <span class="feature-badge">
            <i class="fas fa-ruler-combined mr-1"></i> ${property.area} sqft
          </span>
        </div>
      </div>
    </div>
  `;
}

// Function to update UI with properties
async function displayProperties() {
  // Fetch favorite properties
  const savedPropertyIds = await fetchSavedProperties();
  console.log('[displayProperties] savedPropertyIds:', savedPropertyIds);
  // Fetch and display all properties
  currentFilters.sort = 'createdAt';
  currentFilters.order = 'desc';
  const data = await fetchAllProperties(currentPage, currentFilters);
  console.log('[displayProperties] Propriedades carregadas:', data.posts.map(p => p.id));
  if (data.posts.length > 0) {
    window.lastLoadedProperties = data.posts;
    totalPages = data.pagination.pages;
    // Mark favorites BEFORE rendering cards
    const savedIds = savedPropertyIds.map(id => id.toString());
    let favoritosContador = 0;
    data.posts.forEach(property => {
      property.isFavorite = savedIds.includes(property.id.toString());
      console.log(`[DEBUG] Card ${property.id} isFavorite:`, property.isFavorite);
      if (property.isFavorite) favoritosContador++;
    });
    console.log(`[displayProperties] Total favoritos pintados: ${favoritosContador}`);
    if (allPropertiesContainer) {
      allPropertiesContainer.innerHTML = data.posts.map(renderPropertyCard).join('');
    }
    // Adicionar event listeners para os botões de favorito
    document.querySelectorAll('.favorite-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const icon = btn.querySelector('i');
        if (icon.classList.contains('text-red-500')) {
          icon.classList.remove('text-red-500');
          icon.classList.add('text-gray-500');
        } else {
          icon.classList.remove('text-gray-500');
          icon.classList.add('text-red-500');
        }
        // Aqui podes chamar a função para atualizar na base de dados se quiseres
      });
    });
  }
}

// Inicialização e event listeners
async function initApp() {
  // Carregar propriedades em destaque
  featuredProperties = await fetchFeaturedProperties();
  if (featuredProperties.length > 0 && propertiesContainer) {
    propertiesContainer.innerHTML = renderFeaturedProperty(featuredProperties[0]);
  }
  
  // Carregar propriedades recomendadas
  recommendedProperties = await fetchRecommendedProperties();
  if (recommendedProperties.length > 0 && recommendedContainer) {
    recommendedContainer.innerHTML = recommendedProperties
      .map(property => renderPropertyCard(property))
      .join('');
  }
  
  // Adicionar event listeners para os botões de favorito
  document.querySelectorAll('.favorite-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!currentUser) {
        // Mostrar modal de login
        document.getElementById('login-modal').classList.remove('hidden');
        return;
      }
      
      const propertyId = btn.dataset.id;
      try {
        await saveProperty(propertyId);
        btn.querySelector('i').classList.remove('far');
        btn.querySelector('i').classList.add('fas');
        btn.querySelector('i').classList.add('text-red-500');
      } catch (error) {
        alert(error.message);
      }
    });
  });

  // Proteger event listeners para elementos que podem não existir
  if (searchForm) {
    searchForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(searchForm);
      const queryParams = Object.fromEntries(formData.entries());
      const searchResults = await searchProperties(queryParams);
      // Renderizar resultados da busca (implementar conforme necessário)
    });
  }
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      // ...existing code...
    });
  }
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      // ...existing code...
    });
  }
}

// Chamar a função de inicialização
initApp();