import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { List, ListItem } from "@/types/list";
import { toast } from "sonner";

interface ListsContextType {
  lists: List[];
  loading: boolean;
  createList: (name: string, isWishlist?: boolean) => Promise<List | null>;
  deleteList: (listId: string) => Promise<void>;
  addItemToList: (listId: string, productId: string, variantId: string) => Promise<void>;
  removeItemFromList: (itemId: string) => Promise<void>;
  getListItems: (listId: string) => Promise<ListItem[]>;
  generateShareToken: (listId: string) => Promise<string | null>;
  isInList: (listId: string, productId: string, variantId: string) => Promise<boolean>;
  refreshLists: () => Promise<void>;
}

const ListsContext = createContext<ListsContextType | undefined>(undefined);

export const ListsProvider = ({ children }: { children: ReactNode }) => {
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLists = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLists([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("lists")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLists(data || []);
    } catch (error) {
      console.error("Error fetching lists:", error);
      toast.error("Failed to load lists");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  const createList = async (name: string, isWishlist = false): Promise<List | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to create lists");
        return null;
      }

      const { data, error } = await supabase
        .from("lists")
        .insert([{ name, is_wishlist: isWishlist, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      setLists((prev) => [data, ...prev]);
      toast.success(`${isWishlist ? "Wishlist" : "List"} created successfully`);
      return data;
    } catch (error) {
      console.error("Error creating list:", error);
      toast.error("Failed to create list");
      return null;
    }
  };

  const deleteList = async (listId: string) => {
    try {
      const { error } = await supabase
        .from("lists")
        .delete()
        .eq("id", listId);

      if (error) throw error;
      
      setLists((prev) => prev.filter((list) => list.id !== listId));
      toast.success("List deleted successfully");
    } catch (error) {
      console.error("Error deleting list:", error);
      toast.error("Failed to delete list");
    }
  };

  const addItemToList = async (listId: string, productId: string, variantId: string) => {
    try {
      // Check if item already exists
      const { data: existing } = await supabase
        .from("list_items")
        .select("id")
        .eq("list_id", listId)
        .eq("product_id", productId)
        .eq("variant_id", variantId)
        .maybeSingle();

      if (existing) {
        toast.info("Item already in list");
        return;
      }

      const { error } = await supabase
        .from("list_items")
        .insert([{ list_id: listId, product_id: productId, variant_id: variantId }]);

      if (error) throw error;
      toast.success("Added to list");
    } catch (error) {
      console.error("Error adding item to list:", error);
      toast.error("Failed to add item");
    }
  };

  const removeItemFromList = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("list_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;
      toast.success("Removed from list");
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Failed to remove item");
    }
  };

  const getListItems = async (listId: string): Promise<ListItem[]> => {
    try {
      const { data, error } = await supabase
        .from("list_items")
        .select("*")
        .eq("list_id", listId)
        .order("added_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching list items:", error);
      return [];
    }
  };

  const generateShareToken = async (listId: string): Promise<string | null> => {
    try {
      const token = crypto.randomUUID();
      const { error } = await supabase
        .from("lists")
        .update({ share_token: token })
        .eq("id", listId);

      if (error) throw error;
      
      setLists((prev) =>
        prev.map((list) =>
          list.id === listId ? { ...list, share_token: token } : list
        )
      );
      
      toast.success("Share link generated");
      return token;
    } catch (error) {
      console.error("Error generating share token:", error);
      toast.error("Failed to generate share link");
      return null;
    }
  };

  const isInList = async (listId: string, productId: string, variantId: string): Promise<boolean> => {
    try {
      const { data } = await supabase
        .from("list_items")
        .select("id")
        .eq("list_id", listId)
        .eq("product_id", productId)
        .eq("variant_id", variantId)
        .maybeSingle();

      return !!data;
    } catch (error) {
      console.error("Error checking list:", error);
      return false;
    }
  };

  const refreshLists = async () => {
    await fetchLists();
  };

  return (
    <ListsContext.Provider
      value={{
        lists,
        loading,
        createList,
        deleteList,
        addItemToList,
        removeItemFromList,
        getListItems,
        generateShareToken,
        isInList,
        refreshLists,
      }}
    >
      {children}
    </ListsContext.Provider>
  );
};

export const useLists = () => {
  const context = useContext(ListsContext);
  if (context === undefined) {
    throw new Error("useLists must be used within a ListsProvider");
  }
  return context;
};
