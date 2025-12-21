import { Request, Response } from "express";
import { ProductService } from "./product.service";
import {
  CreateProductDTO,
  UpdateProductDTO,
  CreateVariationDTO,
  UpdateVariationDTO,
} from "./product.dto";
import {
  isValidUUID,
  isValidString,
  toInt,
} from "../../shared/utils/validation";
import { AppError } from "../../app/middleware/error.middleware";

export class ProductController {
  constructor(private service: ProductService) {}

  private getActorId(req: Request): string | undefined {
    return req.user?.userId;
  }

  private getLojaFilter(req: Request): string | undefined {
    const user = req.user;
    if (!user || user.role === "SUPER_ADMIN") return undefined;
    return user.lojaId;
  }

  // ============================================================================
  // PRODUTOS
  // ============================================================================

  createProduct = async (req: Request, res: Response) => {
    const body = req.body as CreateProductDTO;
    const actorUserId = this.getActorId(req);

    if (!actorUserId) throw new AppError("Não autenticado.", 401);

    // Validações básicas antes de chamar service (opcional, pode estar tudo no service)
    if (!isValidUUID(body.id_loja)) throw new AppError("Loja inválida.");
    if (!isValidString(body.nome)) throw new AppError("Nome obrigatório.");

    const result = await this.service.createProduct({ ...body, actorUserId });
    return res.status(201).json(result);
  };

  updateProduct = async (req: Request, res: Response) => {
    const { id } = req.params;
    const body = req.body as UpdateProductDTO;
    const actorUserId = this.getActorId(req);

    if (!actorUserId) throw new AppError("Não autenticado.", 401);
    if (!isValidUUID(id)) throw new AppError("ID inválido.");

    const result = await this.service.updateProduct(id, {
      ...body,
      actorUserId,
    });
    return res.json(result);
  };

  deleteProduct = async (req: Request, res: Response) => {
    const { id } = req.params;
    const actorUserId = this.getActorId(req);

    if (!actorUserId) throw new AppError("Não autenticado.", 401);
    if (!isValidUUID(id)) throw new AppError("ID inválido.");

    await this.service.deleteProduct(id, actorUserId);
    return res.status(204).send();
  };

  getProductById = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!isValidUUID(id)) throw new AppError("ID inválido.");

    const result = await this.service.getProductById(id);
    return res.json(result);
  };

  // ============================================================================
  // VARIAÇÕES
  // ============================================================================

  createVariation = async (req: Request, res: Response) => {
    const body = req.body as CreateVariationDTO;
    const actorUserId = this.getActorId(req);

    if (!actorUserId) throw new AppError("Não autenticado.", 401);
    if (!isValidUUID(body.id_produto)) throw new AppError("Produto inválido.");
    if (!isValidString(body.nome)) throw new AppError("Nome obrigatório.");
    if (body.quantidade < 0) throw new AppError("Quantidade inválida.");
    if (body.valor < 0) throw new AppError("Valor inválido.");

    const result = await this.service.createVariation({ ...body, actorUserId });
    return res.status(201).json(result);
  };

  updateVariation = async (req: Request, res: Response) => {
    const { id } = req.params;
    const body = req.body as UpdateVariationDTO;
    const actorUserId = this.getActorId(req);

    if (!actorUserId) throw new AppError("Não autenticado.", 401);
    if (!isValidUUID(id)) throw new AppError("ID inválido.");

    const result = await this.service.updateVariation(id, {
      ...body,
      actorUserId,
    });
    return res.json(result);
  };

  deleteVariation = async (req: Request, res: Response) => {
    const { id } = req.params;
    const actorUserId = this.getActorId(req);

    if (!actorUserId) throw new AppError("Não autenticado.", 401);
    if (!isValidUUID(id)) throw new AppError("ID inválido.");

    await this.service.deleteVariation(id, actorUserId);
    return res.status(204).send();
  };

  getVariationById = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!isValidUUID(id)) throw new AppError("ID inválido.");

    const result = await this.service.getVariationById(id);
    return res.json(result);
  };

  getPaginatedProductVariations = async (req: Request, res: Response) => {
    const { id } = req.params;
    const page = toInt(req.query.page, 1);
    const perPage = toInt(req.query.perPage, 10);

    const result = await this.service.getPaginatedVariationsByProduct(
      id,
      page,
      perPage
    );
    return res.json(result);
  };

  searchProductVariations = async (req: Request, res: Response) => {
    const { id } = req.params;
    const term = String(req.query.term || "");
    const page = toInt(req.query.page, 1);
    const perPage = toInt(req.query.perPage, 10);

    const result = await this.service.searchPaginatedVariationsByProduct(
      id,
      term,
      page,
      perPage
    );
    return res.json(result);
  };

  // ============================================================================
  // LISTAGENS GERAIS
  // ============================================================================

  getPaginated = async (req: Request, res: Response) => {
    const page = toInt(req.query.page, 1);
    const perPage = toInt(req.query.perPage, 10);
    const type = req.query.type as string;
    const lojaId = this.getLojaFilter(req);

    if (type === "variation") {
      const result = await this.service.getVariationsPaginated(
        page,
        perPage,
        lojaId
      );
      return res.json(result);
    }

    const result = await this.service.getProductsPaginated(
      page,
      perPage,
      lojaId
    );
    return res.json(result);
  };

  searchPaginated = async (req: Request, res: Response) => {
    const term = String(req.query.term || "");
    const page = toInt(req.query.page, 1);
    const perPage = toInt(req.query.perPage, 10);
    const type = req.query.type as string;
    const lojaId = this.getLojaFilter(req);

    if (type === "variation") {
      const result = await this.service.searchVariations(
        term,
        page,
        perPage,
        lojaId
      );
      return res.json(result);
    }

    const result = await this.service.searchProducts(
      term,
      page,
      perPage,
      lojaId
    );
    return res.json(result);
  };
}
