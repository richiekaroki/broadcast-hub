import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Content, ContentStatus } from './entities/content.entity';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { UserRole } from '../users/enums/user-role.enum';
import { MemoryCache } from '../common/cache';

const cache = new MemoryCache();
const CONTENT_LIST_KEY = 'content:list';
const CONTENT_TTL = 300; // 5 minutes

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);

  constructor(
    @InjectRepository(Content) private readonly repo: Repository<Content>,
  ) {}

  /*** CRUD ***/

  async create(dto: CreateContentDto, authorId: string): Promise<Content> {
    const content = this.repo.create({
      ...dto,
      status: ContentStatus.DRAFT,
      authorId,
    });
    const saved = await this.repo.save(content);
    this.invalidateCache();
    return saved;
  }

  async findAll(): Promise<Content[]> {
    return this.repo.find();
  }

  async findPublished(): Promise<Content[]> {
    const cached = cache.get<Content[]>(CONTENT_LIST_KEY);
    if (cached) return cached;

    const published = await this.repo.find({
      where: { status: ContentStatus.PUBLISHED },
    });
    cache.set(CONTENT_LIST_KEY, published, CONTENT_TTL);
    return published;
  }

  async findOne(id: string, requesterRole?: UserRole): Promise<Content> {
    const content = await this.repo.findOne({ where: { id } });
    if (!content) throw new NotFoundException('Content not found');

    const canSeeAll = requesterRole === UserRole.SUPER_ADMIN || requesterRole === UserRole.EDITOR;
    if (!canSeeAll && content.status !== ContentStatus.PUBLISHED) {
      throw new NotFoundException('Content not found');
    }

    return content;
  }

  async update(id: string, dto: UpdateContentDto): Promise<Content> {
    const content = await this.repo.findOne({ where: { id } });
    if (!content) throw new NotFoundException('Content not found');
    if (dto.title !== undefined) content.title = dto.title;
    if (dto.body !== undefined) content.body = dto.body;
    const saved = await this.repo.save(content);
    this.invalidateCache();
    return saved;
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo.delete(id);
    if (result.affected === 0) throw new NotFoundException('Content not found');
    this.invalidateCache();
  }

  /*** Editorial workflow ***/

  async submitForReview(id: string): Promise<Content> {
    const content = await this.repo.findOne({ where: { id } });
    if (!content) throw new NotFoundException('Content not found');
    content.status = ContentStatus.PENDING_REVIEW;
    const saved = await this.repo.save(content);
    this.invalidateCache();
    return saved;
  }

  async publish(id: string): Promise<Content> {
    const content = await this.repo.findOne({ where: { id } });
    if (!content) throw new NotFoundException('Content not found');
    content.status = ContentStatus.PUBLISHED;
    const saved = await this.repo.save(content);
    this.invalidateCache();
    return saved;
  }

  async reject(id: string, reason: string): Promise<Content> {
    const content = await this.repo.findOne({ where: { id } });
    if (!content) throw new NotFoundException('Content not found');
    content.status = ContentStatus.REJECTED;
    content.rejectionReason = reason;
    const saved = await this.repo.save(content);
    this.invalidateCache();
    return saved;
  }

  /*** Cache helper ***/
  private invalidateCache(): void {
    cache.del(CONTENT_LIST_KEY);
  }
}
