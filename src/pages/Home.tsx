import HeroSection from "../components/frontpage/HeroSection"
import ProjectsShowcase from "../components/frontpage/ProjectsShowcase"
import NewProjectsShowCase from "../components/frontpage/NewProjectsShowCase"

function Home(){
    return(
        <>
            <HeroSection />
            <ProjectsShowcase />
            <NewProjectsShowCase />
        </>
    )
}

export default Home