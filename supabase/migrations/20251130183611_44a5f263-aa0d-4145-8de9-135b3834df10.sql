-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create lists table for user wishlists and custom lists
CREATE TABLE public.lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_wishlist BOOLEAN NOT NULL DEFAULT false,
  share_token TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create list_items table to store products in lists
CREATE TABLE public.list_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_items ENABLE ROW LEVEL SECURITY;

-- Lists policies
CREATE POLICY "Users can view their own lists"
ON public.lists FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view shared lists"
ON public.lists FOR SELECT
USING (share_token IS NOT NULL);

CREATE POLICY "Users can create their own lists"
ON public.lists FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lists"
ON public.lists FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lists"
ON public.lists FOR DELETE
USING (auth.uid() = user_id);

-- List items policies
CREATE POLICY "Users can view items in their lists"
ON public.list_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.lists
    WHERE lists.id = list_items.list_id
    AND (lists.user_id = auth.uid() OR lists.share_token IS NOT NULL)
  )
);

CREATE POLICY "Users can add items to their lists"
ON public.list_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.lists
    WHERE lists.id = list_items.list_id
    AND lists.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete items from their lists"
ON public.list_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.lists
    WHERE lists.id = list_items.list_id
    AND lists.user_id = auth.uid()
  )
);

-- Create index for performance
CREATE INDEX idx_lists_user_id ON public.lists(user_id);
CREATE INDEX idx_lists_share_token ON public.lists(share_token);
CREATE INDEX idx_list_items_list_id ON public.list_items(list_id);

-- Trigger for updated_at
CREATE TRIGGER update_lists_updated_at
BEFORE UPDATE ON public.lists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();