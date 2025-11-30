export interface List {
  id: string;
  user_id: string;
  name: string;
  is_wishlist: boolean;
  share_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListItem {
  id: string;
  list_id: string;
  product_id: string;
  variant_id: string;
  added_at: string;
}

export interface ListWithItems extends List {
  items: ListItem[];
}
