import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useLists } from "@/context/ListsContext";
import { Plus, Trash2, Share2, Heart, Package } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { products } from "@/data/products";
import { ListItem } from "@/types/list";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Lists = () => {
  const { lists, loading, createList, deleteList, getListItems, generateShareToken, removeItemFromList } = useLists();
  const [newListName, setNewListName] = useState("");
  const [selectedListItems, setSelectedListItems] = useState<Record<string, ListItem[]>>({});
  const [searchParams] = useSearchParams();
  const shareToken = searchParams.get("share");
  const [sharedList, setSharedList] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    if (shareToken) {
      loadSharedList(shareToken);
    }
  }, [shareToken]);

  const loadSharedList = async (token: string) => {
    try {
      const { data: list } = await supabase
        .from("lists")
        .select("*")
        .eq("share_token", token)
        .single();

      if (list) {
        const { data: items } = await supabase
          .from("list_items")
          .select("*")
          .eq("list_id", list.id);

        setSharedList({ ...list, items });
      }
    } catch (error) {
      console.error("Error loading shared list:", error);
    }
  };

  const loadListItems = async (listId: string) => {
    if (selectedListItems[listId]) return;
    const items = await getListItems(listId);
    setSelectedListItems((prev) => ({ ...prev, [listId]: items }));
  };

  const handleCreateList = async (isWishlist: boolean) => {
    if (!user) {
      toast.error("Please sign in to create lists");
      return;
    }
    
    if (!newListName.trim() && !isWishlist) {
      toast.error("Please enter a list name");
      return;
    }
    const name = isWishlist ? "My Wishlist" : newListName;
    await createList(name, isWishlist);
    setNewListName("");
  };

  const handleShare = async (listId: string) => {
    const token = await generateShareToken(listId);
    if (token) {
      const shareUrl = `${window.location.origin}/lists?share=${token}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied to clipboard!");
    }
  };

  const handleRemoveItem = async (itemId: string, listId: string) => {
    await removeItemFromList(itemId);
    setSelectedListItems((prev) => ({
      ...prev,
      [listId]: prev[listId].filter((item) => item.id !== itemId),
    }));
  };

  const getProductDetails = (productId: string, variantId: string) => {
    const product = products.find((p) => p.id === productId);
    const variant = product?.variants.find((v) => v.id === variantId);
    return { product, variant };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-8">
          <p className="text-center text-muted-foreground">Loading lists...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (sharedList) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                {sharedList.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sharedList.items?.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">This list is empty</p>
              ) : (
                <div className="space-y-4">
                  {sharedList.items?.map((item: ListItem) => {
                    const { product, variant } = getProductDetails(item.product_id, item.variant_id);
                    if (!product || !variant) return null;
                    return (
                      <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded" />
                        <div className="flex-1">
                          <h4 className="font-semibold">{product.name}</h4>
                          <p className="text-sm text-muted-foreground">{product.brand} • {variant.size}</p>
                          <p className="text-primary font-bold mt-1">₹{variant.price}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-8 flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Sign In Required</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Please sign in to create and manage your lists.</p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const wishlist = lists.find((l) => l.is_wishlist);
  const customLists = lists.filter((l) => !l.is_wishlist);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold mb-2">My Lists</h1>
          <p className="text-muted-foreground">Organize and save your favorite products</p>
        </div>

        {/* Wishlist Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-display font-bold flex items-center gap-2">
              <Heart className="h-6 w-6 text-primary" />
              Wishlist
            </h2>
            {!wishlist && (
              <Button onClick={() => handleCreateList(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Wishlist
              </Button>
            )}
          </div>

          {wishlist ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{wishlist.name}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleShare(wishlist.id)}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => deleteList(wishlist.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" onClick={() => loadListItems(wishlist.id)} className="w-full">
                      <Package className="h-4 w-4 mr-2" />
                      View Items
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{wishlist.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {selectedListItems[wishlist.id]?.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No items yet</p>
                      ) : (
                        selectedListItems[wishlist.id]?.map((item) => {
                          const { product, variant } = getProductDetails(item.product_id, item.variant_id);
                          if (!product || !variant) return null;
                          return (
                            <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                              <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded" />
                              <div className="flex-1">
                                <h4 className="font-semibold">{product.name}</h4>
                                <p className="text-sm text-muted-foreground">{product.brand} • {variant.size}</p>
                                <p className="text-primary font-bold mt-1">₹{variant.price}</p>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(item.id, wishlist.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Create a wishlist to save your favorite items</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Custom Lists Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-display font-bold">Custom Lists</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New List
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New List</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="List name (e.g., Weekly Shopping)"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button onClick={() => handleCreateList(false)}>Create List</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {customLists.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No custom lists yet. Create one to get started!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customLists.map((list) => (
                <Card key={list.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-lg">{list.name}</CardTitle>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleShare(list.id)}>
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteList(list.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" onClick={() => loadListItems(list.id)} className="w-full">
                          <Package className="h-4 w-4 mr-2" />
                          View Items
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{list.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          {selectedListItems[list.id]?.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">No items yet</p>
                          ) : (
                            selectedListItems[list.id]?.map((item) => {
                              const { product, variant } = getProductDetails(item.product_id, item.variant_id);
                              if (!product || !variant) return null;
                              return (
                                <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                                  <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded" />
                                  <div className="flex-1">
                                    <h4 className="font-semibold">{product.name}</h4>
                                    <p className="text-sm text-muted-foreground">{product.brand} • {variant.size}</p>
                                    <p className="text-primary font-bold mt-1">₹{variant.price}</p>
                                  </div>
                                  <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(item.id, list.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Lists;
