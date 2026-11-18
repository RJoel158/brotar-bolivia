import { UpdateVisibility, UpdateVisibilityScope } from '../value-objects/update-visibility.vo';

export interface CampaignUpdateProps {
  id: string;
  campaignId: string;
  authorUserId: string;
  title: string;
  body: string;
  imageUrl: string | null;
  visibility: UpdateVisibility;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCampaignUpdateCommand {
  id?: string;
  campaignId: string;
  authorUserId: string;
  title: string;
  body: string;
  imageUrl?: string | null;
  visibility?: string;
  publishedAt?: Date | null;
}

export class CampaignUpdate {
  private constructor(private readonly props: CampaignUpdateProps) {}

  public static create(command: CreateCampaignUpdateCommand): CampaignUpdate {
    const trimmedTitle = command.title?.trim();
    if (!trimmedTitle || trimmedTitle.length < 3) {
      throw new Error('El título de la actualización debe tener al menos 3 caracteres.');
    }
    if (trimmedTitle.length > 200) {
      throw new Error('El título no puede exceder los 200 caracteres.');
    }

    const trimmedBody = command.body?.trim();
    if (!trimmedBody || trimmedBody.length < 10) {
      throw new Error('El contenido del comunicado debe tener al menos 10 caracteres.');
    }

    const visibility = command.visibility
      ? UpdateVisibility.fromString(command.visibility)
      : UpdateVisibility.PUBLIC;

    const now = new Date();
    const id = command.id || crypto.randomUUID();

    return new CampaignUpdate({
      id,
      campaignId: command.campaignId,
      authorUserId: command.authorUserId,
      title: trimmedTitle,
      body: trimmedBody,
      imageUrl: command.imageUrl?.trim() || null,
      visibility,
      publishedAt: command.publishedAt ?? now,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(props: {
    id: string;
    campaignId: string;
    authorUserId: string;
    title: string;
    body: string;
    imageUrl: string | null;
    visibility: UpdateVisibilityScope;
    publishedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): CampaignUpdate {
    return new CampaignUpdate({
      ...props,
      visibility: UpdateVisibility.fromString(props.visibility),
    });
  }

  public getId(): string {
    return this.props.id;
  }

  public getCampaignId(): string {
    return this.props.campaignId;
  }

  public getAuthorUserId(): string {
    return this.props.authorUserId;
  }

  public getTitle(): string {
    return this.props.title;
  }

  public getBody(): string {
    return this.props.body;
  }

  public getImageUrl(): string | null {
    return this.props.imageUrl;
  }

  public getVisibility(): UpdateVisibility {
    return this.props.visibility;
  }

  public getPublishedAt(): Date | null {
    return this.props.publishedAt;
  }

  public getCreatedAt(): Date {
    return this.props.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.props.updatedAt;
  }
}
