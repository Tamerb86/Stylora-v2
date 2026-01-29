import { Router, Request, Response } from 'express';
import { productService } from '../services/product.service.js';
import {
  sendSuccess,
  sendSuccessWithMessage,
  sendNotFound,
  sendServerError,
  sendValidationError,
} from '../utils/response.js';
import {
  createProductSchema,
  updateProductSchema,
  paginationSchema,
  uuidSchema,
} from '../utils/validation.js';

const router = Router();

/**
 * GET /api/v1/products
 * Get all products for the current user
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      sendNotFound(res, 'User');
      return;
    }

    // Validate pagination params
    const paginationResult = paginationSchema.safeParse(req.query);
    
    if (!paginationResult.success) {
      sendValidationError(res, 'Invalid pagination parameters');
      return;
    }

    const { page, limit } = paginationResult.data;
    const offset = (page - 1) * limit;

    // Get products
    const products = await productService.getProductsByUserId(req.user.id, {
      limit,
      offset,
    });

    // Get total count
    const total = await productService.countProductsByUserId(req.user.id);

    sendSuccess(res, {
      items: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    sendServerError(res);
  }
});

/**
 * GET /api/v1/products/:id
 * Get a single product with latest generated content
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      sendNotFound(res, 'User');
      return;
    }

    // Validate ID
    const idResult = uuidSchema.safeParse(req.params.id);
    
    if (!idResult.success) {
      sendValidationError(res, 'Invalid product ID');
      return;
    }

    // Get product with latest content
    const product = await productService.getProductWithLatestContent(
      idResult.data,
      req.user.id
    );

    if (!product) {
      sendNotFound(res, 'Product');
      return;
    }

    sendSuccess(res, product);
  } catch (error) {
    console.error('Error fetching product:', error);
    sendServerError(res);
  }
});

/**
 * POST /api/v1/products
 * Create a new product
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      sendNotFound(res, 'User');
      return;
    }

    // Validate input
    const validationResult = createProductSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const errors: Record<string, string[]> = {};
      validationResult.error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
      });
      sendValidationError(res, errors);
      return;
    }

    // Create product
    const product = await productService.createProduct({
      userId: req.user.id,
      ...validationResult.data,
    });

    sendSuccessWithMessage(res, product, 'Product created successfully', 201);
  } catch (error) {
    console.error('Error creating product:', error);
    sendServerError(res);
  }
});

/**
 * PATCH /api/v1/products/:id
 * Update a product
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      sendNotFound(res, 'User');
      return;
    }

    // Validate ID
    const idResult = uuidSchema.safeParse(req.params.id);
    
    if (!idResult.success) {
      sendValidationError(res, 'Invalid product ID');
      return;
    }

    // Validate input
    const validationResult = updateProductSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const errors: Record<string, string[]> = {};
      validationResult.error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
      });
      sendValidationError(res, errors);
      return;
    }

    // Update product
    const product = await productService.updateProduct(
      idResult.data,
      req.user.id,
      validationResult.data
    );

    if (!product) {
      sendNotFound(res, 'Product');
      return;
    }

    sendSuccessWithMessage(res, product, 'Product updated successfully');
  } catch (error) {
    console.error('Error updating product:', error);
    sendServerError(res);
  }
});

/**
 * DELETE /api/v1/products/:id
 * Delete a product
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      sendNotFound(res, 'User');
      return;
    }

    // Validate ID
    const idResult = uuidSchema.safeParse(req.params.id);
    
    if (!idResult.success) {
      sendValidationError(res, 'Invalid product ID');
      return;
    }

    // Delete product
    const deleted = await productService.deleteProduct(idResult.data, req.user.id);

    if (!deleted) {
      sendNotFound(res, 'Product');
      return;
    }

    sendSuccessWithMessage(res, null, 'Product deleted successfully');
  } catch (error) {
    console.error('Error deleting product:', error);
    sendServerError(res);
  }
});

export default router;
