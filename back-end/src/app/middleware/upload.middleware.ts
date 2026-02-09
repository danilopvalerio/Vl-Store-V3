import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import { Request, Response, NextFunction } from "express";
import { AppError } from "./error.middleware";
import sharp from "sharp";

// Diretório de upload para produtos
const productUploadDir = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "uploads",
  "produtos",
);

// Diretório de upload para perfis/avatares
const profileUploadDir = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "uploads",
  "perfis",
);

// Criar diretórios se não existirem
if (!fs.existsSync(productUploadDir)) {
  fs.mkdirSync(productUploadDir, { recursive: true });
}

if (!fs.existsSync(profileUploadDir)) {
  fs.mkdirSync(profileUploadDir, { recursive: true });
}

// Alias para compatibilidade
const uploadDir = productUploadDir;

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

// Upload para perfis (single file)
export const uploadProfilePhoto = multer({
  storage: multer.memoryStorage(),
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB entrada
}).single("foto");

// Middleware para processar foto de perfil
export const processProfilePhoto = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.file) {
    return next();
  }

  const file = req.file as Express.Multer.File;

  try {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const baseName = uniqueSuffix;

    // Nomes para salvar
    const filenameLarge = `${baseName}-lg.jpeg`;
    const pathLarge = path.join(profileUploadDir, filenameLarge);
    const pathMedium = path.join(profileUploadDir, `${baseName}-md.jpeg`);
    const pathThumb = path.join(profileUploadDir, `${baseName}-thumb.jpeg`);

    const imageBuffer = file.buffer;

    // Processamento Paralelo - tamanhos menores para avatares
    await Promise.all([
      sharp(imageBuffer)
        .resize({ width: 400, height: 400, fit: "cover" })
        .toFormat("jpeg")
        .jpeg({ quality: 85 })
        .toFile(pathLarge),
      sharp(imageBuffer)
        .resize({ width: 200, height: 200, fit: "cover" })
        .toFormat("jpeg")
        .jpeg({ quality: 80 })
        .toFile(pathMedium),
      sharp(imageBuffer)
        .resize({ width: 100, height: 100, fit: "cover" })
        .toFormat("jpeg")
        .jpeg({ quality: 75 })
        .toFile(pathThumb),
    ]);

    // Atualiza o file object para o controller usar
    file.path = pathLarge;
    file.filename = filenameLarge;
    file.destination = profileUploadDir;

    // Adiciona caminho relativo para salvar no banco (com /uploads/ para servir estático)
    (req as Request & { processedPhotoPath?: string }).processedPhotoPath =
      `uploads/perfis/${filenameLarge}`;

    next();
  } catch (error) {
    console.error("Erro ao processar foto de perfil:", error);
    next(
      new AppError("Erro ao processar e redimensionar foto de perfil.", 500),
    );
  }
};

// Helper para deletar fotos de perfil antigas
export const deleteProfilePhoto = async (fotoUrl: string): Promise<void> => {
  if (!fotoUrl) return;

  // Base é a pasta raiz do projeto (onde está a pasta uploads)
  const projectRoot = path.resolve(__dirname, "..", "..", "..");

  // Remove o prefixo 'uploads/' se existir, pois vamos construir o caminho completo
  const cleanFotoUrl = fotoUrl.replace(/^uploads\//, "");

  // Extrai o nome base do arquivo (sem o sufixo -lg, -md, -thumb)
  const fileName = path.basename(cleanFotoUrl);
  const baseNameMatch = fileName.match(/^(.+)-lg\.jpeg$/);

  if (!baseNameMatch) {
    // Se não segue o padrão esperado, tenta deletar apenas o arquivo específico
    const filePath = path.join(projectRoot, "uploads", cleanFotoUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return;
  }

  const baseName = baseNameMatch[1];
  const folder = path.dirname(cleanFotoUrl);
  const folderPath = path.join(projectRoot, "uploads", folder);

  // Deleta todas as variações
  const suffixes = ["-lg.jpeg", "-md.jpeg", "-thumb.jpeg"];
  for (const suffix of suffixes) {
    const filePath = path.join(folderPath, `${baseName}${suffix}`);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error(`Erro ao deletar ${filePath}:`, err);
      }
    }
  }
};
