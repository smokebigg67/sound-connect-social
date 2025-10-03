import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mic, Users, Zap, Lock } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Mic,
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
        <div className="absolute inset-0 bg-gradient-audio opacity-10" />
        
        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-audio mb-4">
              <Mic className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold">
              <span className="bg-gradient-audio bg-clip-text text-transparent">
                VoiceConnect
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              The social platform where every conversation is an audio experience. 
              Share your voice, connect authentically.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={() => navigate("/auth")}
                size="lg"
                className="bg-gradient-audio hover:opacity-90 text-lg px-8 py-6"
              >
                Get Started
              </Button>
              <Button
                onClick={() => navigate("/feed")}
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-border"
              >
                Explore Feed
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-card/50">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why VoiceConnect?
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-audio flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to start your audio journey?
          </h2>
          <p className="text-xl text-muted-foreground">
            Join thousands of users sharing their voice on VoiceConnect
          </p>
          <Button
            onClick={() => navigate("/auth")}
            size="lg"
            className="bg-gradient-audio hover:opacity-90 text-lg px-8 py-6"
          >
            Create Your Account
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
