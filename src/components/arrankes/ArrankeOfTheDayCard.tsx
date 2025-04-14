import { ThumbsUp, SquareArrowOutUpRight } from "lucide-react";

function ArrankeOfTheDayCard() {
    return(
        <div className="card card-border border-primary lg:card-side bg-base-100 shadow-sm">
            <figure>
                <img
                src="https://placehold.co/200x200/orange/white"
                alt="logo" />
            </figure>
            <div className="card-body">
                <h2 className="card-title">Arranke destacado del dia</h2>
                <p>description del arranke corta o eslogan</p>
                <div className="card-actions justify-end">
                    <button className="btn btn-ghost">
                        <ThumbsUp className="mr-2" />
                        100
                    </button>
                    <button className="btn btn-primary">
                        <SquareArrowOutUpRight className="mr-2" />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ArrankeOfTheDayCard;