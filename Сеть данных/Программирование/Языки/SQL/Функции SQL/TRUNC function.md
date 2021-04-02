==TRUNC(ch, precision)== - отсекает часть числа без округления, либо меняет числа на нули.

==TRUNC(date, date precision format)== отсекает часть даты. По умолчанию в качетве date выступает день. Чтобы записать второй аргмент, необходимо использовать следующий формат:
![[Pasted image 20210310182021.png]]

***Примеры:***
```sql

SQL> select TRUNC(35345.4567, 3) from dual;

TRUNC(35345.4567,3)
-------------------
          35345.456

SQL> select TRUNC(35345.4567, 4) from dual;

TRUNC(35345.4567,4)
-------------------
         35345.4567

SQL> select TRUNC(35345.4567, 1) from dual;

TRUNC(35345.4567,1)
-------------------
            35345.4

SQL> select TRUNC(35345.4567, -2) from dual;

TRUNC(35345.4567,-2)
--------------------
               35300
```
---
*теги:* #database, #sql, #sqlFunction #single-row_func  #numeric_func 