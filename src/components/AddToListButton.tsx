import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLists } from "@/context/ListsContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

interface AddToListButtonProps {
  productId: string;
  variantId: string;
  variant?: "icon" | "button";
}

const AddToListButton = ({ productId, variantId, variant = "icon" }: AddToListButtonProps) => {
  const { lists, addItemToList } = useLists();
  const [user, setUser] = useState<any>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleAddToList = async (listId: string) => {
    if (!user) {
      toast.error("Please sign in to add items to lists");
      return;
    }
    
    await addItemToList(listId, productId, variantId);
    setOpen(false);
  };

  const wishlist = lists.find((l) => l.is_wishlist);

  if (!user) {
    return variant === "icon" ? (
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.preventDefault();
          toast.error("Please sign in to add items to lists");
        }}
      >
        <Heart className="h-5 w-5" />
      </Button>
    ) : (
      <Button
        variant="outline"
        onClick={(e) => {
          e.preventDefault();
          toast.error("Please sign in to add items to lists");
        }}
      >
        <Heart className="h-4 w-4 mr-2" />
        Add to List
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {variant === "icon" ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => e.preventDefault()}
          >
            <Heart className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={(e) => e.preventDefault()}
          >
            <Heart className="h-4 w-4 mr-2" />
            Add to List
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to List</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {lists.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No lists yet. Create one in the Lists page!
            </p>
          ) : (
            lists.map((list) => (
              <Button
                key={list.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleAddToList(list.id)}
              >
                {list.is_wishlist ? "❤️" : "📋"} {list.name}
              </Button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddToListButton;
