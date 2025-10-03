import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Radio, Users, Zap, Lock } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Radio,
      title: "Audio-First",
      description: "Share your thoughts through voice, not text",
    },
    {
      icon: Users,
      title: "Meaningful Connections",
      description: "Build authentic relationships through audio",
    },
    {
      icon: Zap,
      title: "Real-Time Engagement",
      description: "Comment and interact with voice messages",
    },
    {
      icon: Lock,
      title: "Privacy Control",
      description: "You decide when to share your contact info",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-echo opacity-10" />
        
        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-echo mb-4 shadow-echo animate-pulse-glow">
              <Radio className="w-12 h-12 text-black" />
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter">
              <span className="text-primary">
                ECHO
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-foreground max-w-2xl mx-auto font-medium">
              Your voice, amplified. 
              <br />
              <span className="text-muted-foreground">
                Share audio, connect authentically, make it louder.
              </span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={() => navigate("/auth")}
                size="lg"
                className="bg-gradient-echo hover:opacity-90 text-lg px-8 py-6 text-black font-bold shadow-echo"
              >
                Get Started
              </Button>
              <Button
                onClick={() => navigate("/feed")}
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-primary hover:bg-primary/10 hover:text-primary"
              >
                Explore Feed
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-card/50 border-y border-primary/10">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-12">
            Why <span className="text-primary">ECHO</span>?
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-lg bg-card border border-border hover:border-primary transition-all hover:shadow-card"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-echo flex items-center justify-center mb-4 shadow-echo">
                  <feature.icon className="w-6 h-6 text-black" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-black">
            Ready to make some noise?
          </h2>
          <p className="text-xl text-foreground">
            Join thousands sharing their voice on <span className="text-primary font-bold">ECHO</span>
          </p>
          <Button
            onClick={() => navigate("/auth")}
            size="lg"
            className="bg-gradient-echo hover:opacity-90 text-lg px-8 py-6 text-black font-bold shadow-echo"
          >
            Create Your Account
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
