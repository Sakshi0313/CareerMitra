import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Software Engineer at Google",
    avatar: "PS",
    content: "CareerMitra helped me identify skill gaps I didn't know I had. The AI mock interviews were incredibly realistic and prepared me for my dream job!",
    rating: 5,
  },
  {
    name: "Rahul Verma",
    role: "Data Analyst at Microsoft",
    avatar: "RV",
    content: "The ATS resume analyzer boosted my resume score from 45% to 92%. I started getting callbacks within a week of using the optimized version.",
    rating: 5,
  },
  {
    name: "Ananya Patel",
    role: "Product Manager at Amazon",
    avatar: "AP",
    content: "The personalized roadmap feature is a game-changer. It gave me a clear path from fresher to PM with specific courses and certifications.",
    rating: 5,
  },
];

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-4">
            Testimonials
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-6">
            Success Stories from{" "}
            <span className="text-accent">Our Students</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Join thousands of students who transformed their careers with CareerMitra.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className="relative bg-card rounded-2xl p-8 shadow-card hover:shadow-card-hover transition-all duration-300 border border-border/50 group hover:-translate-y-1"
            >
              {/* Quote Icon */}
              <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-secondary flex items-center justify-center shadow-lg">
                <Quote className="w-5 h-5 text-secondary-foreground" />
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                ))}
              </div>

              {/* Content */}
              <p className="text-foreground leading-relaxed mb-6 italic">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-foreground">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
