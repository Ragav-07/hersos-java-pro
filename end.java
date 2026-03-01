package com.bus;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.*;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import jakarta.servlet.annotation.*;
import org.json.JSONArray;
import org.json.JSONObject;

@WebServlet("/SearchBusServlet")
public class SearchBusServlet extends HttpServlet {

    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        String from = request.getParameter("from");
        String to = request.getParameter("to");

        response.setContentType("application/json");
        PrintWriter out = response.getWriter();

        JSONArray array = new JSONArray();

        try {
            Connection con = DBConnection.getConnection();

            PreparedStatement ps = con.prepareStatement(
                "SELECT * FROM buses WHERE from_city=? AND to_city=?"
            );

            ps.setString(1, from);
            ps.setString(2, to);

            ResultSet rs = ps.executeQuery();

            while (rs.next()) {
                JSONObject obj = new JSONObject();
                obj.put("id", rs.getInt("id"));
                obj.put("from", rs.getString("from_city"));
                obj.put("to", rs.getString("to_city"));
                obj.put("price", rs.getDouble("price"));

                array.put(obj);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        out.print(array);
    }
}