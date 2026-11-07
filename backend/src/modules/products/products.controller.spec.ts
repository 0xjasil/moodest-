import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController (Unit Tests)', () => {
  let controller: ProductsController;
  let service: ProductsService;

  beforeEach(() => {
    service = {
      getAll: jest.fn().mockResolvedValue({
        items: [{ id: 'p1', name: 'Luxury Abaya', basePrice: 2499 }],
        data: [{ id: 'p1', name: 'Luxury Abaya', basePrice: 2499 }],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
        pages: 1,
      }),
      getById: jest.fn().mockImplementation((id: string) =>
        Promise.resolve({ id, name: 'Luxury Abaya', basePrice: 2499 }),
      ),
      autocomplete: jest.fn().mockResolvedValue(['Luxury Abaya']),
      getTrendingSearches: jest.fn().mockResolvedValue(['Luxury Abaya', 'Silk Abaya']),
      getFacets: jest.fn().mockResolvedValue({ categories: [], brands: [], sizes: ['M', 'L'] }),
      getRelated: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockImplementation((dto) => Promise.resolve({ id: 'p_new', ...dto })),
      update: jest.fn().mockImplementation((id, dto) => Promise.resolve({ id, ...dto })),
      delete: jest.fn().mockResolvedValue({ message: 'Product archived successfully', id: 'p1' }),
    } as unknown as ProductsService;

    controller = new ProductsController(service);
  });

  it('GET /products lists products with filters and pagination', async () => {
    const res = await controller.getAll({ page: 1, limit: 10, search: 'Abaya' });
    expect(res.items).toHaveLength(1);
    expect(res.data).toHaveLength(1);
    expect(res.total).toBe(1);
    expect(service.getAll).toHaveBeenCalledWith({ page: 1, limit: 10, search: 'Abaya' });
  });

  it('GET /products/:id retrieves a product by id or slug', async () => {
    const res = await controller.getById('p1');
    expect(res.id).toBe('p1');
    expect(res.name).toBe('Luxury Abaya');
  });

  it('GET /products/autocomplete returns search suggestions', async () => {
    const res = await controller.autocomplete('Lux');
    expect(res).toContain('Luxury Abaya');
  });

  it('POST /products creates product (Admin role)', async () => {
    const res = await controller.create({ name: 'New Silk Abaya' });
    expect(res.id).toBe('p_new');
    expect(service.create).toHaveBeenCalledWith({ name: 'New Silk Abaya' });
  });
});

