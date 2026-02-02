import { Request, Response } from "express";
import { ProductService } from "./product.service";
import {
  CreateProductDTO,
  UpdateProductDTO,
  CreateVariationDTO,
  UpdateVariationDTO,
} from "./product.dto";
import { isValidUUID, toInt } from "../../shared/utils/validation";
import { AppError } from "../../app/middleware/error.middleware";

// Interfaces Auxiliares para o Body do Multipart
interface CreateVariationMultipartBody {
  id_produto: string;
  nome?: string;
  descricao?: string;
  quantidade: string;
  valor: string;
}

interface UpdateVariationMultipartBody {
  nome?: string;
  descricao?: string;
  quantidade?: string;
  valor?: string;
  // CAMPO NOVO ADICIONADO AQUI:
  kept_images?: string | string[];
}

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

  // --- PRODUTOS ---

  createProduct = async (req: Request, res: Response) => {
    const body = req.body as CreateProductDTO;
    const actorUserId = this.getActorId(req);
    if (!actorUserId) throw new AppError("Não autenticado.", 401);

    const result = await this.service.createProduct({ ...body, actorUserId });
    return res.status(201).json(result);
  };

  updateProduct = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const body = req.body as UpdateProductDTO;
    const actorUserId = this.getActorId(req);

    if (!actorUserId) throw new AppError("Não autenticado.", 401);

    const result = await this.service.updateProduct(id, {
      ...body,
      actorUserId,
    });
    return res.json(result);
  };

  deleteProduct = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const actorUserId = this.getActorId(req);

    if (!actorUserId) throw new AppError("Não autenticado.", 401);

    await this.service.deleteProduct(id, actorUserId);
    return res.status(204).send();
  };

  getProductById = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await this.service.getProductById(id);
    return res.json(result);
  };

  // --- VARIAÇÕES ---

  createVariation = async (req: Request, res: Response) => {
    const rawBody = req.body as CreateVariationMultipartBody;
    const files = req.files as Express.Multer.File[] | undefined;
    const actorUserId = this.getActorId(req);

    if (!actorUserId) throw new AppError("Não autenticado.", 401);

    const dto: CreateVariationDTO = {
      id_produto: rawBody.id_produto,
      nome: rawBody.nome || "",
      descricao: rawBody.descricao,
      quantidade: Number(rawBody.quantidade),
      valor: Number(rawBody.valor),
      actorUserId,
      files: files,
    };

    const result = await this.service.createVariation(dto);
    return res.status(201).json(result);
  };

  updateVariation = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const rawBody = req.body as UpdateVariationMultipartBody;
    const files = req.files as Express.Multer.File[] | undefined;
    const actorUserId = this.getActorId(req);

    if (!actorUserId) throw new AppError("Não autenticado.", 401);
    if (!isValidUUID(id)) throw new AppError("ID inválido.");

    const dto: UpdateVariationDTO = {
      nome: rawBody.nome,
      descricao: rawBody.descricao,
      quantidade: rawBody.quantidade ? Number(rawBody.quantidade) : undefined,
      valor: rawBody.valor ? Number(rawBody.valor) : undefined,
      actorUserId,
      files: files,
      // REPASSANDO O KEPT_IMAGES PARA O DTO:
      kept_images: rawBody.kept_images,
    };

    const result = await this.service.updateVariation(id, dto);
    return res.json(result);
  };

  deleteVariation = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const actorUserId = this.getActorId(req);

    if (!actorUserId) throw new AppError("Não autenticado.", 401);

    await this.service.deleteVariation(id, actorUserId);
    return res.status(204).send();
  };

  getVariationById = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await this.service.getVariationById(id);
    return res.json(result);
  };

  // --- PAGINAÇÃO E BUSCA ---

  getPaginatedProductVariations = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const page = toInt(req.query.page, 1);
    const perPage = toInt(req.query.perPage, 10);

    const result = await this.service.getPaginatedVariationsByProduct(
      id,
      page,
      perPage,
    );
    return res.json(result);
  };

  searchProductVariations = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const term = String(req.query.term || "");
    const page = toInt(req.query.page, 1);
    const perPage = toInt(req.query.perPage, 10);

    const result = await this.service.searchPaginatedVariationsByProduct(
      id,
      term,
      page,
      perPage,
    );
    return res.json(result);
  };

  getPaginated = async (req: Request, res: Response) => {
    const page = toInt(req.query.page, 1);
    const perPage = toInt(req.query.perPage, 10);
    const type = req.query.type as string;
    const orderBy = req.query.orderBy as string | undefined;
    const lojaId = this.getLojaFilter(req);

    if (type === "variation") {
      const result = await this.service.getVariationsPaginated(
        page,
        perPage,
        lojaId,
      );
      return res.json(result);
    }

    const result = await this.service.getProductsPaginated(
      page,
      perPage,
      lojaId,
      orderBy,
    );
    return res.json(result);
  };

  searchPaginated = async (req: Request, res: Response) => {
    const term = String(req.query.term || "");
    const page = toInt(req.query.page, 1);
    const perPage = toInt(req.query.perPage, 10);
    const type = req.query.type as string;
    const orderBy = req.query.orderBy as string | undefined;
    const lojaId = this.getLojaFilter(req);

    if (type === "variation") {
      const result = await this.service.searchVariations(
        term,
        page,
        perPage,
        lojaId,
      );
      return res.json(result);
    }

    const result = await this.service.searchProducts(
      term,
      page,
      perPage,
      lojaId,
      orderBy,
    );
    return res.json(result);
  };
}
