export interface TradeDto {
  id: number;
  title: string;
  image: string;
  description: string;
  requiredBadgeType: string;
  createdAt: string;
  updatedAt: string;
}

export interface AddTradeDto {
  title: string;
  image: string;
  description: string;
  requiredBadgeType: string;
}

export interface UpdateTradeDto {
  title?: string;
  image?: string;
  description?: string;
  requiredBadgeType?: string;
}