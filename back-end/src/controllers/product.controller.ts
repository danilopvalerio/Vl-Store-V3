// src/controllers/product.controller.ts
import { Request, Response } from "express";
import { ProductService } from "../services/product.service";
import {
  CreateProductDTO,
  UpdateProductDTO,
  CreateVariationDTO,
  UpdateVariationDTO,
} from "../dtos/product.dto";
import { isValidUUID, isValidString, toInt } from "../utils/validation";

export class ProductController {
  private service = new ProductService();

  // Helper privado para tratar erros sem usar 'any'
  private handleError(res: Response, err: unknown, status = 400) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return res.status(status).json({ error: message });
  }

  // ============================================================================
  // PRODUTOS
  // ============================================================================

  async createProduct(req: Request, res: Response) {
    try {
      const body = req.body as CreateProductDTO;
      const actorUserId = req.user?.userId;

      if (!actorUserId)
        return res.status(401).json({ error: "Não autenticado." });
      if (!isValidUUID(body.id_loja))
        return res.status(400).json({ error: "Loja inválida." });
      if (!isValidString(body.nome))
        return res.status(400).json({ error: "Nome obrigatório." });

      const result = await this.service.createProduct(body, actorUserId);
      return res.status(201).json(result);
    } catch (err) {
      return this.handleError(res, err);
    }
  }

  async updateProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const body = req.body as UpdateProductDTO;
      const actorUserId = req.user?.userId;

      if (!actorUserId)
        return res.status(401).json({ error: "Não autenticado." });
      if (!isValidUUID(id))
        return res.status(400).json({ error: "ID inválido." });

      const result = await this.service.updateProduct(id, body, actorUserId);
      return res.json(result);
    } catch (err) {
      return this.handleError(res, err);
    }
  }

  async deleteProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const actorUserId = req.user?.userId;

      if (!actorUserId)
        return res.status(401).json({ error: "Não autenticado." });
      if (!isValidUUID(id))
        return res.status(400).json({ error: "ID inválido." });

      await this.service.deleteProduct(id, actorUserId);
      return res.status(204).send();
    } catch (err) {
      return this.handleError(res, err);
    }
  }

  async getProductById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!isValidUUID(id))
        return res.status(400).json({ error: "ID inválido." });

      const result = await this.service.getProductById(id);
      if (!result)
        return res.status(404).json({ error: "Produto não encontrado" });

      return res.json(result);
    } catch (err) {
      return this.handleError(res, err, 500);
    }
  }

  // ============================================================================
  // VARIAÇÕES
  // ============================================================================

  async createVariation(req: Request, res: Response) {
    try {
      const body = req.body as CreateVariationDTO;
      const actorUserId = req.user?.userId;

      if (!actorUserId)
        return res.status(401).json({ error: "Não autenticado." });
      if (!isValidUUID(body.id_produto))
        return res.status(400).json({ error: "Produto inválido." });
      if (!isValidString(body.nome))
        return res.status(400).json({ error: "Nome obrigatório." });
      if (body.quantidade < 0)
        return res.status(400).json({ error: "Quantidade inválida." });
      if (body.valor < 0)
        return res.status(400).json({ error: "Valor inválido." });

      const result = await this.service.createVariation(body, actorUserId);
      return res.status(201).json(result);
    } catch (err) {
      return this.handleError(res, err);
    }
  }

  async updateVariation(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const body = req.body as UpdateVariationDTO;
      const actorUserId = req.user?.userId;

      if (!actorUserId)
        return res.status(401).json({ error: "Não autenticado." });
      if (!isValidUUID(id))
        return res.status(400).json({ error: "ID inválido." });

      const result = await this.service.updateVariation(id, body, actorUserId);
      return res.json(result);
    } catch (err) {
      return this.handleError(res, err);
    }
  }

  async deleteVariation(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const actorUserId = req.user?.userId;

      if (!actorUserId)
        return res.status(401).json({ error: "Não autenticado." });
      if (!isValidUUID(id))
        return res.status(400).json({ error: "ID inválido." });

      await this.service.deleteVariation(id, actorUserId);
      return res.status(204).send();
    } catch (err) {
      return this.handleError(res, err);
    }
  }

  async getVariationById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!isValidUUID(id))
        return res.status(400).json({ error: "ID inválido." });

      const result = await this.service.getVariationById(id);
      if (!result)
        return res.status(404).json({ error: "Variação não encontrada" });

      return res.json(result);
    } catch (err) {
      return this.handleError(res, err, 500);
    }
  }

  // GET /products/:id/variations
  async getPaginatedProductVariations(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const page = toInt(req.query.page, 1);
      const perPage = toInt(req.query.perPage, 10);

      const result = await this.service.getPaginatedVariationsByProduct(
        id,
        page,
        perPage
      );
      return res.json(result);
    } catch (err) {
      return this.handleError(res, err, 500);
    }
  }

  // GET /products/:id/variations/search
  async searchProductVariations(req: Request, res: Response) {
    try {
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
    } catch (err) {
      return this.handleError(res, err, 500);
    }
  }

  // ============================================================================
  // PAGINAÇÃO E BUSCA UNIFICADAS
  // ============================================================================

  private getLojaFilter(req: Request): string | undefined {
    const user = req.user;
    if (!user || user.role === "SUPER_ADMIN") return undefined;
    return user.lojaId;
  }

  // GET /products/paginated
  async getPaginated(req: Request, res: Response) {
    try {
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
    } catch (err) {
      return this.handleError(res, err, 500);
    }
  }

  // GET /products/search
  async searchPaginated(req: Request, res: Response) {
    try {
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
    } catch (err) {
      return this.handleError(res, err, 500);
    }
  }
}
