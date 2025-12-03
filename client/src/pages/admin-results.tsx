import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Edit, Trash2, CircleDot } from "lucide-react";
import { TableSkeleton } from "@/components/loading-skeleton";
import { LotteryBall } from "@/components/lottery-ball";
import { resultFormSchema, type ResultForm, type LotteryResult } from "@shared/schema";

const GAMES = [
  { id: "powerball", name: "Powerball", slug: "powerball", hasBonus: true },
  { id: "powerball-plus", name: "Powerball Plus", slug: "powerball-plus", hasBonus: true },
  { id: "lotto", name: "Lotto", slug: "lotto", hasBonus: true },
  { id: "lotto-plus-1", name: "Lotto Plus 1", slug: "lotto-plus-1", hasBonus: true },
  { id: "lotto-plus-2", name: "Lotto Plus 2", slug: "lotto-plus-2", hasBonus: true },
  { id: "daily-lotto", name: "Daily Lotto", slug: "daily-lotto", hasBonus: false },
  { id: "daily-lotto-plus", name: "Daily Lotto Plus", slug: "daily-lotto-plus", hasBonus: false },
];

export default function AdminResults() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResult, setEditingResult] = useState<LotteryResult | null>(null);
  const [searchDateInput, setSearchDateInput] = useState("");
  const [appliedDate, setAppliedDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const { data: results, isLoading } = useQuery<LotteryResult[]>({
    queryKey: ["/api/results"],
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [appliedDate, results?.length]);

  const form = useForm<ResultForm>({
    resolver: zodResolver(resultFormSchema),
    defaultValues: {
      gameId: "",
      gameName: "",
      gameSlug: "",
      winningNumbers: "",
      bonusNumber: "",
      drawDate: new Date().toISOString().split("T")[0],
      jackpotAmount: "",
      winner: "",
      hotNumber: "",
      coldNumber: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ResultForm) => {
      const payload = {
        gameId: data.gameId,
        gameName: data.gameName,
        gameSlug: data.gameSlug,
        winningNumbers: data.winningNumbers.split(",").map((n) => parseInt(n.trim())),
        bonusNumber: data.bonusNumber ? parseInt(data.bonusNumber) : null,
        drawDate: data.drawDate,
        jackpotAmount: data.jackpotAmount || null,
        winner: data.winner ? parseInt(data.winner) : null,
      };
      const res = await apiRequest("POST", "/api/results", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/results"] });
      queryClient.invalidateQueries({ queryKey: ["/api/results/latest"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Result Added",
        description: "Lottery result has been added successfully.",
      });
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to add lottery result.";
      toast({
        title: "Error",
        description: message.includes("Duplicate") ? message : "Failed to add lottery result. It may already exist for this date.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ResultForm & { id: string }) => {
      const payload = {
        gameId: data.gameId,
        gameName: data.gameName,
        gameSlug: data.gameSlug,
        winningNumbers: data.winningNumbers.split(",").map((n) => parseInt(n.trim())),
        bonusNumber: data.bonusNumber ? parseInt(data.bonusNumber) : null,
        drawDate: data.drawDate,
        jackpotAmount: data.jackpotAmount || null,
        winner: data.winner ? parseInt(data.winner) : null,
      };
      const res = await apiRequest("PATCH", `/api/results/${data.id}`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/results"] });
      queryClient.invalidateQueries({ queryKey: ["/api/results/latest"] });
      setIsDialogOpen(false);
      setEditingResult(null);
      form.reset();
      toast({
        title: "Result Updated",
        description: "Lottery result has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update lottery result.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/results/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/results"] });
      queryClient.invalidateQueries({ queryKey: ["/api/results/latest"] });
      toast({
        title: "Result Deleted",
        description: "Lottery result has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete lottery result.",
        variant: "destructive",
      });
    },
  });

  const handleGameChange = (gameId: string) => {
    const game = GAMES.find((g) => g.id === gameId);
    if (game) {
      form.setValue("gameId", game.id);
      form.setValue("gameName", game.name);
      form.setValue("gameSlug", game.slug);
    }
  };

  const handleDelete = (id: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this result? This action cannot be undone.");
    if (confirmed) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (result: LotteryResult) => {
    setEditingResult(result);
    form.reset({
      gameId: result.gameId,
      gameName: result.gameName,
      gameSlug: result.gameSlug,
      winningNumbers: (Array.isArray(result.winningNumbers) ? result.winningNumbers : JSON.parse(result.winningNumbers as unknown as string || "[]")).join(", "),
      bonusNumber: result.bonusNumber?.toString() || "",
      drawDate: result.drawDate,
      jackpotAmount: result.jackpotAmount || "",
      winner: result.winner?.toString() || "",
      hotNumber: result.hotNumber?.toString() || "",
      coldNumber: result.coldNumber?.toString() || "",
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingResult(null);
    form.reset();
  };

  const onSubmit = (data: ResultForm) => {
    if (editingResult) {
      updateMutation.mutate({ ...data, id: editingResult.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const filteredResults = useMemo(() => {
    if (!results) return [];
    return results.filter((r) => {
      if (!appliedDate) return true;
      return (r.drawDate || "").startsWith(appliedDate);
    });
  }, [results, appliedDate]);

  const totalPages = Math.max(1, Math.ceil(filteredResults.length / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedResults = filteredResults.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
        <CardTitle>Lottery Results</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingResult(null); form.reset(); }} data-testid="button-add-result">
              <Plus className="h-4 w-4 mr-2" />
              Add Result
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingResult ? "Edit Result" : "Add New Result"}</DialogTitle>
              <DialogDescription>
                {editingResult ? "Update the lottery result details." : "Enter the lottery draw details."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="gameId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lottery Game</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleGameChange(value);
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-game">
                            <SelectValue placeholder="Select a game" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {GAMES.map((game) => (
                            <SelectItem key={game.id} value={game.id}>
                              {game.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="winningNumbers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Winning Numbers</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., 5, 12, 23, 34, 45, 50"
                          data-testid="input-winning-numbers"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Enter numbers separated by commas</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bonusNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bonus Number (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 7"
                          data-testid="input-bonus-number"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="drawDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Draw Date</FormLabel>
                      <FormControl>
                        <Input type="date" data-testid="input-draw-date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="jackpotAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jackpot Amount</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., R40,000,000"
                          data-testid="input-jackpot"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="winner"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Winners (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 2"
                          data-testid="input-winner"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-submit-result"
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? "Saving..."
                      : editingResult
                        ? "Update Result"
                        : "Add Result"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="date"
              value={searchDateInput}
              onChange={(e) => setSearchDateInput(e.target.value)}
              className="w-[180px]"
              data-testid="input-search-date"
            />
            <Button
              size="sm"
              onClick={() => setAppliedDate(searchDateInput)}
              data-testid="button-search-date"
            >
              Search
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSearchDateInput("");
                setAppliedDate("");
              }}
              data-testid="button-clear-search"
            >
              Reset
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              data-testid="button-prev-page"
            >
              Prev
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {Math.min(currentPage, totalPages)} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              data-testid="button-next-page"
            >
              Next
            </Button>
          </div>
        </div>
        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : paginatedResults && paginatedResults.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Game</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Numbers</TableHead>
                  <TableHead>Jackpot</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedResults.map((result) => (
                  <TableRow key={result.id} data-testid={`row-result-${result.id}`}>
                    <TableCell>
                      <Badge variant="secondary">{result.gameName}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(result.drawDate)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 flex-wrap">
                        {(Array.isArray(result.winningNumbers) ? result.winningNumbers : JSON.parse(result.winningNumbers as unknown as string || "[]")).slice(0, 4).map((num: number, idx: number) => (
                          <LotteryBall key={idx} number={num} size="sm" />
                        ))}
                        {(Array.isArray(result.winningNumbers) ? result.winningNumbers : JSON.parse(result.winningNumbers as unknown as string || "[]")).length > 4 && (
                          <span className="text-xs text-muted-foreground ml-1">
                            +{(Array.isArray(result.winningNumbers) ? result.winningNumbers : JSON.parse(result.winningNumbers as unknown as string || "[]")).length - 4} more
                          </span>
                        )}
                        {result.bonusNumber && (
                          <>
                            <span className="mx-1">+</span>
                            <LotteryBall number={result.bonusNumber} isBonus size="sm" />
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{result.jackpotAmount || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(result)}
                          data-testid={`button-edit-${result.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(result.id)}
                          data-testid={`button-delete-${result.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12">
            <CircleDot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Results Yet</h3>
            <p className="text-muted-foreground mb-4">
              Add your first lottery result or use the scraper to fetch data.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
