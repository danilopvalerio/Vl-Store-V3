import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import { Request, Response, NextFunction } from "express";
import { AppError } from "./error.middleware";
import sharp from "sharp";

const uploadDir = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "uploads",
  "produtos",
);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Armazena na memória RAM para o Sharp processar antes de salvar
const storage = multer.memoryStorage();

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new AppError("Apenas arquivos de imagem são permitidos!", 400));
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB entrada
});

export const processProductImages = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
    return next();
  }

  const files = req.files as Express.Multer.File[];

  try {
    await Promise.all(
      files.map(async (file) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const baseName = uniqueSuffix;

        // Nomes para salvar
        const filenameLarge = `${baseName}-lg.jpeg`;
        const pathLarge = path.join(uploadDir, filenameLarge);
        const pathMedium = path.join(uploadDir, `${baseName}-md.jpeg`);
        const pathThumb = path.join(uploadDir, `${baseName}-thumb.jpeg`);

        const imageBuffer = file.buffer;

        // Processamento Paralelo
        await Promise.all([
          sharp(imageBuffer)
            .resize({ width: 1200, withoutEnlargement: true })
            .toFormat("jpeg")
            .jpeg({ quality: 80 })
            .toFile(pathLarge),
          sharp(imageBuffer)
            .resize({ width: 800, withoutEnlargement: true })
            .toFormat("jpeg")
            .jpeg({ quality: 80 })
            .toFile(pathMedium),
          sharp(imageBuffer)
            .resize({ width: 300, withoutEnlargement: true })
            .toFormat("jpeg")
            .jpeg({ quality: 70 })
            .toFile(pathThumb),
        ]);

        // Atualiza o file object para o controller usar
        file.path = pathLarge;
        file.filename = filenameLarge;
        file.destination = uploadDir;
      }),
    );

    next();
  } catch (error) {
    console.error("Erro ao processar imagens:", error);
    next(new AppError("Erro ao processar e redimensionar imagens.", 500));
  }
};
