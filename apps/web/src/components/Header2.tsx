
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Menu, MoveRight, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function Header2() {
  const navigationItems = [
    {
      title: "Home",
      href: "/",
      description: "",
    },
    {
      title: "How It Works",
      description: "Learn how zkad revolutionizes advertising",
      items: [
        {
          title: "For Users",
          href: "#for-users",
          description: "Earn crypto from your social media",
        },
        {
          title: "For Brands",
          href: "#for-brands",
          description: "Reach authentic audiences at scale",
        },
        {
          title: "Technology",
          href: "#technology",
          description: "Zero-knowledge proof technology",
        },
        {
          title: "Calculator",
          href: "#calculator",
          description: "Calculate your earnings",
        },
      ],
    },
    {
      title: "Resources",
      description: "Everything you need to get started",
      items: [
        {
          title: "Documentation",
          href: "/docs",
          description: "Complete API and integration docs",
        },
        {
          title: "GitHub",
          href: "https://github.com",
          description: "Open source code",
        },
        {
          title: "FAQ",
          href: "#faq",
          description: "Frequently asked questions",
        },
        {
          title: "Support",
          href: "/support",
          description: "Get help from our team",
        },
      ],
    },
  ];

  const [isOpen, setOpen] = useState(false);
  
  return (
    <header className="w-full z-40 fixed top-0 left-0 bg-background border-b">
      <div className="container relative mx-auto min-h-16 flex gap-4 flex-row lg:grid lg:grid-cols-3 items-center">
        <div className="justify-start items-center gap-4 lg:flex hidden flex-row">
          <NavigationMenu className="flex justify-start items-start">
            <NavigationMenuList className="flex justify-start gap-4 flex-row">
              {navigationItems.map((item) => (
                <NavigationMenuItem key={item.title}>
                  {item.href ? (
                    <NavigationMenuLink asChild>
                      <Link to={item.href}>
                        <Button variant="ghost">{item.title}</Button>
                      </Link>
                    </NavigationMenuLink>
                  ) : (
                    <>
                      <NavigationMenuTrigger className="font-medium text-sm">
                        {item.title}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent className="!w-[450px] p-4">
                        <div className="flex flex-col lg:grid grid-cols-2 gap-4">
                          <div className="flex flex-col h-full justify-between">
                            <div className="flex flex-col">
                              <p className="text-base font-semibold">{item.title}</p>
                              <p className="text-muted-foreground text-sm">
                                {item.description}
                              </p>
                            </div>
                            <Button size="sm" className="mt-10">
                              Get Started
                            </Button>
                          </div>
                          <div className="flex flex-col text-sm h-full justify-end">
                            {item.items?.map((subItem) => (
                              <NavigationMenuLink
                                asChild
                                key={subItem.title}
                              >
                                <Link
                                  to={subItem.href}
                                  className="flex flex-col justify-start items-start hover:bg-muted py-2 px-4 rounded group"
                                >
                                  <div className="flex flex-row justify-between items-center w-full">
                                    <span className="font-medium">{subItem.title}</span>
                                    <MoveRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                  <span className="text-xs text-muted-foreground">{subItem.description}</span>
                                </Link>
                              </NavigationMenuLink>
                            ))}
                          </div>
                        </div>
                      </NavigationMenuContent>
                    </>
                  )}
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        
        <div className="flex lg:justify-center">
          <Link to="/" className="font-bold text-xl">zkad</Link>
        </div>
        
        <div className="flex justify-end w-full gap-4">
          <Button variant="outline">Documentation</Button>
          <Button>Get Started</Button>
        </div>
        
        <div className="flex w-12 shrink lg:hidden items-end justify-end">
          <Button variant="ghost" onClick={() => setOpen(!isOpen)}>
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          {isOpen && (
            <div className="absolute top-16 border-t flex flex-col w-full right-0 bg-background shadow-lg py-4 container gap-8">
              {navigationItems.map((item) => (
                <div key={item.title}>
                  <div className="flex flex-col gap-2">
                    {item.href ? (
                      <Link
                        to={item.href}
                        className="flex justify-between items-center"
                      >
                        <span className="text-lg">{item.title}</span>
                        <MoveRight className="w-4 h-4 stroke-1 text-muted-foreground" />
                      </Link>
                    ) : (
                      <p className="text-lg font-medium">{item.title}</p>
                    )}
                    {item.items &&
                      item.items.map((subItem) => (
                        <Link
                          key={subItem.title}
                          to={subItem.href}
                          className="flex justify-between items-center pl-4"
                        >
                          <span className="text-muted-foreground">
                            {subItem.title}
                          </span>
                          <MoveRight className="w-4 h-4 stroke-1" />
                        </Link>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}