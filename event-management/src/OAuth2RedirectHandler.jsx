import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function OAuth2RedirectHandler () {
    const navigate  = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() =>{
        const token = searchParams.get("token");
        const error = searchParams.get("error");

        if(token){
            localStorage.setItem("token",token);
            localStorage.setItem("role","user");
            navigate("/user",{replace:true});
        }else if (error){
        navigate(`/login?error=${encodeURIComponent(error)}`, {replace:true});
        }else{
            navigate("/login",{replace:true});
        }
    },[navigate,searchParams]);
        return (
        <div className="min-h-screen bg-[#0c0c0f] flex items-center justify-center text-white">
            <div className="flex flex-col items-center gap-4">
                <span className="w-8 h-8 border-4 border-[#a3e635]/30 border-t-[#a3e635] rounded-full animate-spin" />
                <p className="text-[#5a5a62] font-semibold tracking-wider uppercase text-sm">
                    Completing login...
                </p>
            </div>
        </div>
  );

}