import ArrankeOfTheDayCard from "../arrankes/ArrankeOfTheDayCard";

const HeroSection = () => {
    return (
        <div className="bg-base-200 min-h-screen w-full flex items-center justify-center">
            <div className="container mx-auto px-4">
                <div className="hero min-h-[80vh]">
                    <div className="hero-content flex-col lg:flex-row text-center lg:text-left gap-8">
                        <div className="max-w-md">
                            <h1 className="text-5xl font-bold">arranka tu proyecto</h1>
                            <p className="py-6">
                                arranke es una plataforma que te permite crear y compartir tus proyectos de con todos.
                            </p>
                            <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                                <button className="btn btn-primary">arranka tu proyecto</button>
                                <button className="btn btn-accent">ve todos los arrankes</button>
                            </div>
                        </div>
                        <ArrankeOfTheDayCard />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default HeroSection;