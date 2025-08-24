//src/services/ValidationUtils.ts
/**
 * Classe utilitária para validar informações diversas.
 * Contém métodos estáticos para verificar a conformidade dos dados de entrada
 * com as regras de negócio e formatos esperados, podendo ser reutilizada por diferentes entidades.
 */
export class ValidationUtils {
  /**
   * Valida um nome genérico.
   * O nome não pode ser vazio e deve ter um comprimento mínimo e máximo.
   * @param nome O nome a ser validado.
   * @param minLength O comprimento mínimo permitido para o nome (padrão: 3).
   * @param maxLength O comprimento máximo permitido para o nome (padrão: 255).
   * @throws Error se o nome for inválido.
   */
  static validateNome(
    nome: string,
    minLength: number = 3,
    maxLength: number = 255
  ): void {
    if (!nome || nome.trim() === "") {
      throw new Error("O nome não pode ser vazio.");
    }
    if (nome.trim().length < minLength) {
      throw new Error(`O nome deve ter pelo menos ${minLength} caracteres.`);
    }
    if (nome.trim().length > maxLength) {
      throw new Error(`O nome não pode exceder ${maxLength} caracteres.`);
    }
  }

  /**
   * Valida o formato de um endereço de e-mail.
   * @param email O endereço de e-mail a ser validado.
   * @throws Error se o e-mail for inválido.
   */
  static validateEmail(email: string): void {
    if (!email || email.trim() === "") {
      throw new Error("O e-mail não pode ser vazio.");
    }
    // Regex para validação básica de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Formato de e-mail inválido.");
    }
    if (email.trim().length > 255) {
      throw new Error("O e-mail não pode exceder 255 caracteres.");
    }
  }

  /**
   * Valida a senha com regras básicas.
   * A senha deve ter um comprimento mínimo, conter letras maiúsculas, minúsculas,
   * números e caracteres especiais.
   * @param senha A senha a ser validada.
   * @throws Error se a senha for inválida.
   */
  static validateSenha(senha: string): void {
    if (!senha || senha.length < 8) {
      throw new Error("A senha deve ter no mínimo 8 caracteres.");
    }
    if (!/[A-Z]/.test(senha)) {
      throw new Error("A senha deve conter pelo menos uma letra maiúscula.");
    }
    if (!/[a-z]/.test(senha)) {
      throw new Error("A senha deve conter pelo menos uma letra minúscula.");
    }
    if (!/[0-9]/.test(senha)) {
      throw new Error("A senha deve conter pelo menos um número.");
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(senha)) {
      throw new Error("A senha deve conter pelo menos um caractere especial.");
    }
  }

  /**
   * Valida o formato de um número de telefone (apenas dígitos, comprimento específico).
   * Considera formatos comuns de telefone brasileiro (10 ou 11 dígitos).
   * @param telefone O número de telefone a ser validado.
   * @throws Error se o telefone for inválido.
   */
  static validateTelefone(telefone: string): void {
    if (!telefone || telefone.trim() === "") {
      throw new Error("O telefone não pode ser vazio.");
    }
    // Remove caracteres não numéricos
    const telefoneNumeros = telefone.replace(/\D/g, "");
    if (telefoneNumeros.length < 10 || telefoneNumeros.length > 11) {
      throw new Error("O telefone deve ter 10 ou 11 dígitos (incluindo DDD).");
    }
  }

  /**
   * Valida o formato de CPF ou CNPJ.
   * Verifica se o valor é um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.
   * Esta validação é apenas de formato/comprimento, não de dígitos verificadores.
   * @param cpfCnpj O CPF ou CNPJ a ser validado.
   * @throws Error se o CPF/CNPJ for inválido.
   */
  static validateCpfCnpj(cpfCnpj: string): void {
    if (!cpfCnpj || cpfCnpj.trim() === "") {
      throw new Error("O CPF/CNPJ não pode ser vazio.");
    }
    // Remove caracteres não numéricos
    const numeros = cpfCnpj.replace(/\D/g, "");

    if (numeros.length === 11) {
      // É um CPF, pode adicionar validação de dígitos verificadores aqui se quiser
      // Exemplo: if (!this.isValidCpf(numeros)) throw new Error("CPF inválido.");
      return;
    } else if (numeros.length === 14) {
      // É um CNPJ, pode adicionar validação de dígitos verificadores aqui se quiser
      // Exemplo: if (!this.isValidCnpj(numeros)) throw new Error("CNPJ inválido.");
      return;
    } else {
      throw new Error(
        "Formato de CPF ou CNPJ inválido. Deve ter 11 ou 14 dígitos."
      );
    }
  }

  /**
   * Valida uma data de nascimento.
   * Verifica se é uma data válida e se a pessoa tem pelo menos a idade mínima.
   * @param dataNasc A data de nascimento a ser validada.
   * @param minAge A idade mínima permitida (padrão: 0, para validação geral de data).
   * @throws Error se a data de nascimento for inválida ou não atender à idade mínima.
   */
  static validateDataNascimento(dataNasc: Date, minAge: number = 0): void {
    if (!(dataNasc instanceof Date) || isNaN(dataNasc.getTime())) {
      throw new Error("Data de nascimento inválida.");
    }

    if (minAge > 0) {
      const hoje = new Date();
      const dataMinima = new Date(
        hoje.getFullYear() - minAge,
        hoje.getMonth(),
        hoje.getDate()
      );

      if (dataNasc > dataMinima) {
        throw new Error(`A idade mínima exigida é de ${minAge} anos.`);
      }
    }
  }

  /**
   * Método de validação abrangente para todos os campos de uma nova Loja.
   * @param data Os dados da loja a serem validados.
   * @throws Error se qualquer campo for inválido.
   */
  static validateNewLoja(data: {
    nome: string;
    senha: string;
    email: string;
    cpfCnpjProprietarioLoja: string;
    dataNascProprietario: Date;
    telefone: string;
  }): void {
    this.validateNome(data.nome);
    this.validateEmail(data.email);
    this.validateSenha(data.senha);
    this.validateTelefone(data.telefone);
    this.validateCpfCnpj(data.cpfCnpjProprietarioLoja);
    // Para loja, o proprietário deve ter pelo menos 18 anos
    this.validateDataNascimento(new Date(data.dataNascProprietario), 18);
  }
}
