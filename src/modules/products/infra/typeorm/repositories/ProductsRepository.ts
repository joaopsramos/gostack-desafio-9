import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = await this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = await this.ormRepository.findOne({
      where: {
        name,
      },
    });

    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const productsId = products.map(product => product.id);

    const productsFound = await this.ormRepository.find({
      where: {
        id: In(productsId),
      },
    });

    return productsFound;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const updatedProducts: Product[] = [];

    products.forEach(async product => {
      await this.ormRepository.decrement(
        { id: product.id },
        'quantity',
        product.quantity,
      );

      const updatedProduct = await this.ormRepository.findOne(product.id);

      if (!updatedProduct) throw new Error('Internal server error');

      updatedProducts.push(updatedProduct);
    });

    return updatedProducts;
  }
}

export default ProductsRepository;
