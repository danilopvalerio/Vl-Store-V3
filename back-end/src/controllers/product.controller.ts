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
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Erro desconhecido" });
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
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
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
      res.status(204).send();
    } catch (err: any) {
      res.status(400).json({ error: err.message });
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

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
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
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
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
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
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
      res.status(204).send();
    } catch (err: any) {
      res.status(400).json({ error: err.message });
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

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // GET /products/:id/variations
  async getPaginatedProductVariations(req: Request, res: Response) {
    try {
      // MUDANÇA: Pegamos o ID da URL (:id), não da query (?productId=)
      const { id } = req.params;

      const page = Number(req.query.page) || 1;
      const perPage = Number(req.query.perPage) || 10;

      // Chama seu service passando o ID que veio da URL
      const result = await this.service.getPaginatedVariationsByProduct(
        id,
        page,
        perPage
      );

      return res.json(result);
    } catch (err) {
      console.error("Error fetching product variations paginated:", err);
      return res.status(500).json({ error: "Erro ao buscar variações." });
    }
  }

  // GET /products/:id/variations/search
  async searchProductVariations(req: Request, res: Response) {
    try {
      // MUDANÇA: Pegamos o ID da URL
      const { id } = req.params;

      const term = (req.query.term as string) || "";
      const page = Number(req.query.page) || 1;
      const perPage = Number(req.query.perPage) || 10;

      const result = await this.service.searchPaginatedVariationsByProduct(
        id,
        term,
        page,
        perPage
      );

      return res.json(result);
    } catch (err) {
      console.error("Error searching product variations:", err);
      return res
        .status(500)
        .json({ error: "Erro ao buscar variações filtradas." });
    }
  }

  // ============================================================================
  // PAGINAÇÃO E BUSCA UNIFICADAS (QUERY PARAM 'TYPE')
  // ============================================================================

  private getLojaFilter(req: Request): string | undefined {
    const user = req.user;
    if (!user || user.role === "SUPER_ADMIN") return undefined;
    return user.lojaId;
  }

  // GET /products/paginated?type=product (default) ou type=variation
  async getPaginated(req: Request, res: Response) {
    try {
      const page = toInt(req.query.page, 1);
      const perPage = toInt(req.query.perPage, 10);
      const type = req.query.type as string; // 'product' ou 'variation'
      const lojaId = this.getLojaFilter(req);

      if (type === "variation") {
        const result = await this.service.getVariationsPaginated(
          page,
          perPage,
          lojaId
        );
        return res.json(result);
      }

      // Default: Product
      const result = await this.service.getProductsPaginated(
        page,
        perPage,
        lojaId
      );
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // GET /products/search?term=...&type=product (default) ou type=variation
  async searchPaginated(req: Request, res: Response) {
    try {
      const term = (req.query.term as string) || "";
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

      // Default: Product
      const result = await this.service.searchProducts(
        term,
        page,
        perPage,
        lojaId
      );
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
