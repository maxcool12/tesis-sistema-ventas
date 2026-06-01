import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Usuario } from './usuario.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private repo: Repository<Usuario>
  ) {}

  async create(data: any) {
    return this.repo.save(data);
  }

  async login(data: any) {
    const user = await this.repo.findOneBy({ email: data.email });

    if (!user || user.password !== data.password) {
      throw new Error('Credenciales inválidas');
    }

    return user; // 🔥 incluye rol
  }
}