import { SquareArrowOutUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Arranke } from "../../types/arranke";
import { getDisplayName } from "../../utils/displayNamePreference";
import LikeDislikeButtons from "./LikeDislikeButtons";

interface ArrankeProps {
    arranke?: Arranke;
}

const ArrankeCard = ({ arranke }: ArrankeProps) => {
    // If no arranke data is provided, show a placeholder encouraging users to create projects
    if (!arranke) {
        return (
            <div className="card bg-base-100 shadow-xl">
                <figure className="flex items-center justify-center p-4">
                    <img
                        src="https://placehold.co/200x200/blue/white?text=Arranke"
                        alt="placeholder"
                        className="w-[150px] h-[150px] md:w-[200px] md:h-[200px] object-cover rounded-lg" />
                </figure>
                <div className="card-body text-center">
                    <h2 className="card-title justify-center">¡Crea tu propio arranke!</h2>
                    <p>Comparte tus proyectos con la comunidad y recibe feedback.</p>
                    <div className="card-actions justify-center mt-4">
                        <Link to="/newArranke" className="btn btn-primary">Crear Arranke</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card lg:card-side bg-base-100 shadow-sm border-2 border-primary">
            <figure className="flex items-center justify-center p-2">
                <img
                src={arranke.logo_url || "https://placehold.co/200x200/blue/white"}
                alt={arranke.arranke_name}
                className="w-[200px] h-[200px] md:w-[300px] md:h-[300px] lg:w-[200px] lg:h-[200px] object-cover rounded-lg" />
            </figure>
            <div className="card-body">
                <h2 className="card-title">{arranke.arranke_name}</h2>
                <p>{arranke.arranke_slogan || arranke.arranke_description?.substring(0, 120) || "Sin descripción"}</p>
                <p>creador por: {getDisplayName(arranke.arranke_name, arranke.owner_name, arranke.owner_username, arranke.display_name_preference)}</p>
                {arranke.arranke_category && <div className="badge badge-accent">{arranke.arranke_category}</div>}
                <div className="card-actions justify-end">
                    <LikeDislikeButtons
                        arrankeId={arranke.id.toString()}
                        initialLikes={arranke.likes_count || 0}
                        initialDislikes={arranke.dislikes_count || 0}
                    />
                    <Link to={`/${arranke.arranke_name}`} className="btn btn-primary">< SquareArrowOutUpRight size={24} /></Link>
                </div>
            </div>
        </div>
    )
}

export default ArrankeCard;