enum EvolveResult {
  NoIntersection,
  FoundIntersection,
  StillEvolving,
}

bool AddSupport(Vector2 _dir)
{
  Vector2 newSupportPoint = vertices.Add(shapeA.Support(_dir) - shapeB.Support(-_dir));
  vertices.Add(newSupportPoint);

  return Vector2.Dot(_dir, newSupportPoint) >= 0;
}

public EvolveResult EvolveSimplex()
{
  switch (vertices.length) {
    case 0:
      {
        direction = shapeB.Center - shapeA.Center;

        break;
      }

    case 1:
      {
        // flip the direction
        direction *= -1;

        break;
      }

    case 2:
      {
        var b = vertices[1];
        var c = vertices[0];

        // line cb is the line formed by the first two vertices
        var cb = b - c;

        // line c0 is the line from the first vertex to the origin
        var c0 = Vector2.Zero - c;

        // use the triple-cross-product to calculate a direction
        // perpendicular the line cb in the direction of the origin
        direction = TripleProduct(cb, c0, cb);

        break;
      }

    case 3:
      {
        // calculate if the simplex contains the origin
        var a = vertices[2];
        var b = vertices[1];
        var c = vertices[0];

        var a0 = Vector2.Zero - a;
        var ab = b - a;
        var ac = c - a;

        var abPerp = TripleProduct(ac, ab, ab);
        var acPerp = TripleProduct(ab, ac, ac);

        if (abPerp.Dot(a0) > 0) {
          // the origin is outside line ab
          // get rid of c and add a new support in the direction of abPerp
          vertices.Remove(c);
          direction = abPerp;
        }
        else if (acPerp.Dot(a0) > 0) {
          // the origin is outside line ac
          // get rid of b and add a new support in the direction of acPerp
          vertices.Remove(b);
          direction = acPerp;
        }
        else {
          // the origin is inside both ab and ac
          // so it must be inside the triangle!
          return EvolveResult.FoundIntersection;
        }

        break;
      }

    default:
      {
        Console.WriteLine("Can't have simplex with " + vertices.length + " vertices!");
        break;
      }
  }

  return AddSupport(direction) ? EvolveResult.StillEvolving : EvolveResult.NoIntersection;
}