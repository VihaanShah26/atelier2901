import { Link } from "react-router-dom";
import PageLayout from "@/components/atelier/PageLayout";

const NotFound = () => {
  return (
    <PageLayout>
      <section className="max-w-3xl mx-auto px-6 lg:px-12 py-16 lg:py-24 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4 font-light">
          404
        </p>
        <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl mb-6">
          Page not found
        </h1>
        <Link 
          to="/"
          className="text-sm uppercase tracking-widest font-light text-muted-foreground hover:text-foreground transition-colors"
        >
          Return home
        </Link>
      </section>
    </PageLayout>
  );
};

export default NotFound;