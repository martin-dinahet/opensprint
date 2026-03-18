"use client";

import * as Button from "@/components/ui/button";
import * as Card from "@/components/ui/card";

export default function IndexPage() {
  return (
    <div>
      <main className="flex h-screen w-screen items-center justify-center">
        <Card.Card size="sm" className="w-full max-w-xs">
          <Card.CardHeader>
            <Card.CardTitle className="font-bold">Hello, World!</Card.CardTitle>
          </Card.CardHeader>
          <Card.CardContent>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptates,
            veniam accusamus, dolores aliquid sunt porro maiores deleniti
            consequuntur quod mollitia eum, fugiat dicta suscipit cum magnam
            neque at autem non!
          </Card.CardContent>
          <Card.CardFooter>
            <Card.CardAction>
              <Button.Button>Go back</Button.Button>
            </Card.CardAction>
          </Card.CardFooter>
        </Card.Card>
      </main>
    </div>
  );
}
