import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import AppError from '@shared/errors/AppError';
import { inject, injectable } from 'tsyringe';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) throw new AppError('Customer not found');

    const productsFound = await this.productsRepository.findAllById(products);

    if (productsFound.length === 0) throw new AppError('Products not found');

    const productsToReturn = products.map(product => {
      const productToCompare = productsFound.find(
        productFound => productFound.id === product.id,
      );

      if (!productToCompare) throw new Error('Internal error server');

      const quantityToSubtract = productToCompare.quantity - product.quantity;

      if (quantityToSubtract < 0)
        throw new AppError('There are not enough products in stock');

      return {
        ...productToCompare,
        quantity: product.quantity,
      };
    });

    await this.productsRepository.updateQuantity(products);

    // const productsToReturn = updatedProducts.map(updatedProduct => {
    //   const productWithQuantity = products.find(
    //     products => products.id === updatedProduct.id,
    //   );

    //   if (!productWithQuantity) throw new AppError('Something went wrong');

    //   const quantity = productWithQuantity.quantity;

    //   return {
    //     ...updatedProduct,
    //     quantity,
    //   };
    // });

    const order = await this.ordersRepository.create({
      customer,
      products: productsToReturn.map(({ id, quantity, price }) => ({
        product_id: id,
        quantity,
        price,
      })),
    });

    return order;
  }
}

export default CreateOrderService;
