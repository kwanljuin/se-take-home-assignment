"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type OrderStatus = "pending" | "processing" | "completed";

type Order = {
  id: string;
  status: OrderStatus;
  isVIP: boolean;
  progress: number;
  orderDateTime: Date;
  completedDateTime: Date | null;
};

type Bot = {
  id: string;
  currentOrder: Order | null;
};

export default function Home() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [bots, setBots] = useState<Bot[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);

  const createOrder = (isVIP: boolean) => {
    const newOrder: Order = {
      id: `${Date.now()}${Math.floor(Math.random() * 900) + 100}`,
      status: "pending",
      isVIP,
      progress: 0,
      orderDateTime: new Date(),
      completedDateTime: null,
    };
    setOrders((prevOrders) => {
      const lastVIPIndex = prevOrders.findLastIndex((order) => order.isVIP);
      if (isVIP) {
        return [
          newOrder,
          ...prevOrders.slice(0, lastVIPIndex + 1),
          ...prevOrders.slice(lastVIPIndex + 1),
        ];
      } else {
        return [
          ...prevOrders.slice(0, lastVIPIndex + 1),
          newOrder,
          ...prevOrders.slice(lastVIPIndex + 1),
        ];
      }
    });
  };

  const removeOrder = (orderId: string) => {
    if (confirm("Are you sure you want to remove this order?")) {
      setOrders((prevOrders) =>
        prevOrders.filter((order) => order.id !== orderId)
      );
    }
  };

  const addBot = () => {
    const newBot: Bot = {
      id: `bot-${Date.now()}-${Math.random().toString(16)}`,
      currentOrder: null,
    };
    setBots((prevBots) => [...prevBots, newBot]);
  };

  const removeBot = () => {
    setBots((prevBots) => {
      if (prevBots.length === 0) return prevBots;
      const lastBot = prevBots[prevBots.length - 1];
      if (lastBot.currentOrder) {
        setOrders((prevOrders) => {
          const orderToRevert: Order = {
            ...lastBot.currentOrder!,
            progress: 0,
            status: "pending",
          };

          // Check if the order is already in the list
          if (prevOrders.some((order) => order.id === orderToRevert.id)) {
            return prevOrders;
          }

          // Find the correct insertion index
          let insertIndex = prevOrders.findIndex((order) => {
            if (orderToRevert.isVIP && !order.isVIP) return true;
            if (orderToRevert.isVIP === order.isVIP) {
              return (
                orderToRevert.orderDateTime.getTime() <
                order.orderDateTime.getTime()
              );
            }
            return false;
          });

          if (insertIndex === -1) insertIndex = prevOrders.length;

          // Insert the order at the correct position
          return [
            ...prevOrders.slice(0, insertIndex),
            orderToRevert,
            ...prevOrders.slice(insertIndex),
          ];
        });
      }
      return prevBots.slice(0, -1);
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setBots((prevBots) => {
        const updatedOrders = [...orders];

        const newBots = prevBots.map((bot) => {
          if (!bot.currentOrder && updatedOrders.length > 0) {
            const orderToProcess = updatedOrders.shift();
            if (orderToProcess) {
              return {
                ...bot,
                currentOrder: {
                  ...orderToProcess,
                  progress: 0,
                  status: "processing" as OrderStatus,
                },
              };
            }
          }

          if (bot.currentOrder) {
            const updatedOrder = {
              ...bot.currentOrder,
              progress: bot.currentOrder.progress + 10,
            };

            if (updatedOrder.progress >= 100) {
              const completedOrder = {
                ...updatedOrder,
                completedDateTime: new Date(),
                status: "completed" as OrderStatus,
              };
              setCompletedOrders((prevCompleted) => {
                const alreadyCompleted = prevCompleted.some(
                  (order) => order.id === completedOrder.id
                );
                if (!alreadyCompleted) {
                  return [completedOrder, ...prevCompleted];
                }
                return prevCompleted;
              });
              return { ...bot, currentOrder: null };
            }

            return { ...bot, currentOrder: updatedOrder };
          }

          return bot;
        });

        setOrders(updatedOrders);

        return newBots;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [orders]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold my-4 text-center">
        {`McDonald's Order System`}
      </h1>
      <div className="flex justify-between my-8 bg-gray-200 items-center p-4 rounded-xl">
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => createOrder(false)} className="mr-2">
            New Normal Order
          </Button>
          <Button onClick={() => createOrder(true)} className="mr-2">
            New VIP Order
          </Button>
        </div>

        <div className="flex items-center">
          <h2 className="text-lg mr-3">Active Bots: </h2>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={removeBot}>
              <Minus className="h-4 w-4" />
            </Button>
            <h2 className="text-lg">{bots.length}</h2>
            <Button variant="outline" size="icon" onClick={addBot}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 w-full">
        <div className="w-full lg:w-1/3">
          <h2 className="text-xl font-semibold mb-2">Pending Orders</h2>
          <ScrollArea className="h-[300px] lg:h-[calc(100vh-300px)] rounded-md border">
            <div className="p-4">
              {orders.map((order) => (
                <OrderCard
                  key={`pending-${order.id}`}
                  order={order}
                  removeOrder={removeOrder}
                />
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="w-full lg:w-1/3">
          <h2 className="text-xl font-semibold mb-2">Processing Orders</h2>
          <ScrollArea className="h-[300px] lg:h-[calc(100vh-300px)] rounded-md border">
            <div className="p-4">
              {bots.map(
                (bot) =>
                  bot.currentOrder && (
                    <OrderCard
                      key={`processing-${bot.currentOrder.id}`}
                      order={bot.currentOrder}
                      progress={bot.currentOrder.progress}
                    />
                  )
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="w-full md:w-1/3">
          <h2 className="text-xl font-semibold mb-2">Completed Orders</h2>
          <ScrollArea className="h-[300px] md:h-[calc(100vh-300px)] rounded-md border">
            <div className="p-4">
              {completedOrders.map((order) => (
                <OrderCard key={`completed-${order.id}`} order={order} />
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

function OrderCard({
  order,
  removeOrder,
  progress,
}: {
  order: Order;
  removeOrder?: (orderId: string) => void;
  progress?: number;
}) {
  return (
    <Card className="mb-4 py-2 pl-2">
      <CardContent>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-1 font-bold text-lg">
              <div className="flex items-center gap-1">
                {order.isVIP && <Badge>VIP</Badge>}
                <h4>Order:</h4>
              </div>
              <h4>{order.id}</h4>
            </div>
            {progress != null && (
              <Progress value={progress ?? 0} className="mt-1" />
            )}
            <div className="text-xs text-gray-500 mt-1">
              Ordered: {order.orderDateTime.toLocaleString()}
            </div>
            {order?.completedDateTime && (
              <div className="text-xs text-gray-500">
                Completed: {order.completedDateTime?.toLocaleString()}
              </div>
            )}
          </div>
          {removeOrder && (
            <Button
              variant="outline"
              onClick={() => removeOrder(order.id)}
              size="sm"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
